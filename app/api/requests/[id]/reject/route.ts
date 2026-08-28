import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendRequestRejectedEmail } from '@/lib/email';

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
    .select('*, athletes(first_name, last_name, guardian_profile_id, profile_id)')
    .eq('id', params.id)
    .single();
  if (fetchErr || !request) return NextResponse.json({ error: 'Richiesta non trovata.' }, { status: 404 });

  const { error: updateErr } = await service
    .from('requests')
    .update({ status: 'rifiutata', internal_note: note || null, user_message: note || null })
    .eq('id', params.id);
  if (updateErr) return NextResponse.json({ error: 'Errore aggiornamento stato.' }, { status: 500 });

  await service.from('activity_log').insert({
    actor_id: user.id,
    action: 'rifiuta_richiesta',
    entity_type: 'requests',
    entity_id: params.id,
    after_data: { status: 'rifiutata', note },
  });

  const holderProfileId = request.athletes.guardian_profile_id ?? request.athletes.profile_id;
  const { data: holderProfile } = await service
    .from('profiles')
    .select('email')
    .eq('id', holderProfileId)
    .single();

  if (holderProfile?.email) {
    await sendRequestRejectedEmail({
      to: holderProfile.email,
      athleteName: `${request.athletes.first_name} ${request.athletes.last_name}`,
      reason: note || undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
