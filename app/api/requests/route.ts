import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { computeQuote, type PriceInstallment, type PricePlan } from '@/lib/pricing';
import { sendRequestReceivedEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    courseId,
    weeklyFrequency,
    entryDate,
    chosenInstallments,
    notes,
    isMinor,
    athlete,
    guardian,
    accountEmail,
    accountPhone,
    password,
    consents,
  } = body;

  if (!courseId || !weeklyFrequency || !entryDate || !chosenInstallments || !accountEmail || !password) {
    return NextResponse.json({ error: 'Dati mancanti nella richiesta.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1. Corso + listini (per validare e calcolare il preventivo lato server: MAI fidarsi del client)
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  if (courseErr || !course) {
    return NextResponse.json({ error: 'Corso non trovato.' }, { status: 404 });
  }

  const { data: plans } = await supabase
    .from('price_plans')
    .select('*, price_installments(*)')
    .eq('course_id', courseId);

  const installmentsByPlan: Record<string, PriceInstallment[]> = {};
  (plans ?? []).forEach((p: any) => (installmentsByPlan[p.id] = p.price_installments));

  let quote;
  try {
    quote = computeQuote({
      course,
      plans: (plans ?? []) as PricePlan[],
      installmentsByPlan,
      weeklyFrequency,
      chosenInstallments,
      entryDate,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  // 2. Crea utente auth (email/password) — l'account è del genitore se minorenne, altrimenti dell'atleta
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email: accountEmail,
    password,
    email_confirm: true,
  });
  if (userErr || !userData.user) {
    return NextResponse.json(
      { error: userErr?.message ?? 'Impossibile creare l\'account. Email già registrata?' },
      { status: 400 }
    );
  }
  const authUserId = userData.user.id;

  // 3. Profilo applicativo
  const holderName = isMinor
    ? `${guardian.firstName} ${guardian.lastName}`
    : `${athlete.firstName} ${athlete.lastName}`;

  const { error: profileErr } = await supabase.from('profiles').insert({
    id: authUserId,
    role: isMinor ? 'parent' : 'athlete',
    full_name: holderName,
    email: accountEmail,
    phone: accountPhone ?? null,
  });
  if (profileErr) {
    return NextResponse.json({ error: 'Errore nella creazione del profilo.' }, { status: 500 });
  }

  // 4. Atleta
  const { data: athleteRow, error: athleteErr } = await supabase
    .from('athletes')
    .insert({
      profile_id: isMinor ? null : authUserId,
      guardian_profile_id: isMinor ? authUserId : null,
      first_name: athlete.firstName,
      last_name: athlete.lastName,
      birth_date: athlete.birthDate,
      fiscal_code: athlete.fiscalCode || null,
    })
    .select()
    .single();
  if (athleteErr || !athleteRow) {
    return NextResponse.json({ error: 'Errore nella creazione dell\'anagrafica atleta.' }, { status: 500 });
  }

  // 5. Consensi
  const consentRows = Object.entries(consents ?? {})
    .filter(([, accepted]) => accepted)
    .map(([type]) => ({
      athlete_id: athleteRow.id,
      guardian_profile_id: authUserId,
      consent_type: type,
      version: '1.0',
    }));
  if (consentRows.length > 0) {
    await supabase.from('consents').insert(consentRows);
  }

  // 6. Richiesta
  const { data: requestRow, error: requestErr } = await supabase
    .from('requests')
    .insert({
      athlete_id: athleteRow.id,
      course_id: courseId,
      weekly_frequency: weeklyFrequency,
      entry_date: entryDate,
      notes: notes || null,
      chosen_installments: chosenInstallments,
      is_late_entry: quote.isLateEntry,
      computed_total: quote.totalAmount,
      status: 'in_attesa',
    })
    .select()
    .single();
  if (requestErr || !requestRow) {
    return NextResponse.json({ error: 'Errore nella creazione della richiesta.' }, { status: 500 });
  }

  // 7. Rate della richiesta (snapshot)
  const installmentRows = quote.installments.map((i) => ({
    request_id: requestRow.id,
    installment_index: i.index,
    amount: i.amount,
    due_date: i.dueDate ?? entryDate,
    status: 'da_pagare',
  }));
  await supabase.from('request_installments').insert(installmentRows);

  // 8. Email di conferma ricezione (non blocca la risposta se fallisce)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  await sendRequestReceivedEmail({
    to: accountEmail,
    athleteName: `${athlete.firstName} ${athlete.lastName}`,
    courseName: course.name,
    entryDate: new Date(entryDate).toLocaleDateString('it-IT'),
    totalAmount: `${quote.totalAmount.toFixed(2)} €`,
    registrationFee: '100,00 €',
    installments: quote.installments.map((i) => ({
      index: i.index,
      amount: `${i.amount.toFixed(2)} €`,
      dueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString('it-IT') : null,
    })),
    areaRiservataUrl: `${siteUrl}/area-riservata`,
  });

  // 9. Log email
  await supabase.from('email_log').insert({
    recipient_email: accountEmail,
    template: 'richiesta_ricevuta',
    related_entity: 'request',
    related_id: requestRow.id,
  });

  return NextResponse.json({ requestId: requestRow.id });
}
