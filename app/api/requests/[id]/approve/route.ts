import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendRequestApprovedEmail } from '@/lib/email';

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

  const { note } = await req.json().catch(() => ({ note: '' }));
  const service = createServiceClient();

  const { data: request, error: fetchErr } = await service
    .from('requests')
    .select('*, courses(name, start_date), athletes(first_name, last_name, guardian_profile_id, profile_id)')
    .eq('id', params.id)
    .single();
  if (fetchErr || !request) return NextResponse.json({ error: 'Richiesta non trovata.' }, { status: 404 });

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
    after_data: { status: 'approvata', note },
  });

  // Recupera email destinatario dal profilo collegato all'atleta
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
      assignmentsText:
        'Giorno e orario definitivi saranno comunicati a breve dalla segreteria (fase di pianificazione).',
      areaRiservataUrl: `${siteUrl}/area-riservata`,
    });
  }

  return NextResponse.json({ ok: true });
}
