import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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
  if (!note) {
    return NextResponse.json({ error: 'Specifica cosa manca o va integrato.' }, { status: 400 });
  }

  const service = createServiceClient();
  const { error: updateErr } = await service
    .from('requests')
    .update({ status: 'da_integrare', user_message: note, internal_note: note })
    .eq('id', params.id);
  if (updateErr) return NextResponse.json({ error: 'Errore aggiornamento stato.' }, { status: 500 });

  await service.from('activity_log').insert({
    actor_id: user.id,
    action: 'richiedi_integrazione',
    entity_type: 'requests',
    entity_id: params.id,
    after_data: { status: 'da_integrare', note },
  });

  // Nota: l'email dedicata "richiesta da integrare" è tra i template previsti (§20)
  // ma per la Fase 1 il messaggio è già visibile nell'Area riservata (vedi requests.user_message).

  return NextResponse.json({ ok: true });
}
