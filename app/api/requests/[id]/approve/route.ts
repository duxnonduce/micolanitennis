import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendRequestApprovedEmail } from '@/lib/email';
import { regenerateSlotCalendar } from '@/lib/calendar-service';

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
  }

  const { note, slotIds } = await req.json().catch(() => ({ note: '', slotIds: [] }));
  if (!Array.isArray(slotIds) || slotIds.length === 0) {
    return NextResponse.json({ error: 'Seleziona almeno uno slot prima di approvare.' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: request, error: fetchErr } = await service
    .from('requests')
    .select('*, courses(name, start_date), athletes(id, first_name, last_name, guardian_profile_id, profile_id)')
    .eq('id', params.id)
    .single();
  if (fetchErr || !request) return NextResponse.json({ error: 'Richiesta non trovata.' }, { status: 404 });

  if (slotIds.length !== request.weekly_frequency) {
    return NextResponse.json(
      { error: `Servono esattamente ${request.weekly_frequency} slot per la frequenza scelta.` },
      { status: 400 }
    );
  }

  // Verifica capacità in tempo reale (evita race condition tra apertura pagina e click su Approva)
  const { data: slots, error: slotsErr } = await service
    .from('recurring_slots')
    .select('*, courts(name), groups(name, max_capacity)')
    .in('id', slotIds);
  if (slotsErr || !slots || slots.length !== slotIds.length) {
    return NextResponse.json({ error: 'Uno o più slot selezionati non sono validi.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const slot of slots) {
    const { count } = await service
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('recurring_slot_id', slot.id)
      .or(`active_to.is.null,active_to.gte.${today}`);
    if ((count ?? 0) >= slot.groups.max_capacity) {
      return NextResponse.json(
        { error: `Lo slot ${slot.courts.name} è ormai pieno. Ricarica la pagina e scegli un altro slot.` },
        { status: 409 }
      );
    }
  }

  // Crea le assignment
  const assignmentRows = slotIds.map((slotId: string) => ({
    athlete_id: request.athletes.id,
    recurring_slot_id: slotId,
    request_id: request.id,
    active_from: request.entry_date,
  }));
  const { error: assignErr } = await service.from('assignments').insert(assignmentRows);
  if (assignErr) return NextResponse.json({ error: 'Errore nella creazione delle assegnazioni.' }, { status: 500 });

  // Genera subito lezioni + prenotazione per i nuovi slot assegnati (idempotente, non tocca dati esistenti)
  for (const slotId of slotIds) {
    try {
      await regenerateSlotCalendar(service, slotId);
    } catch (e) {
      console.error('Errore generazione calendario per slot', slotId, e);
    }
  }

  const { error: updateErr } = await service
    .from('requests')
    .update({
      status: 'approvata',
      internal_note: note || null,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', params.id);
  if (updateErr) return NextResponse.json({ error: 'Errore aggiornamento stato.' }, { status: 500 });

  await service.from('activity_log').insert({
    actor_id: user.id,
    action: 'approva_richiesta',
    entity_type: 'requests',
    entity_id: params.id,
    after_data: { status: 'approvata', note, slotIds },
  });

  const assignmentsText = slots
    .map((s: any) => `${capitalize(DAY_NAMES[s.day_of_week])} ${s.start_time.slice(0, 5)} — ${s.courts.name} (${s.groups.name})`)
    .join('<br>');

  const holderProfileId = request.athletes.guardian_profile_id ?? request.athletes.profile_id;
  const { data: holderProfile } = await service
    .from('profiles')
    .select('email')
    .eq('id', holderProfileId)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (holderProfile?.email) {
    await sendRequestApprovedEmail({
      to: holderProfile.email,
      athleteName: `${request.athletes.first_name} ${request.athletes.last_name}`,
      startDate: new Date(request.entry_date).toLocaleDateString('it-IT'),
      assignmentsText,
      areaRiservataUrl: `${siteUrl}/area-riservata`,
    });
  }

  return NextResponse.json({ ok: true });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
