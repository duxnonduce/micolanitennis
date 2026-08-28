import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
  }

  // Blocco di sicurezza: se ci sono atleti già assegnati a questo slot, evita la cancellazione
  // silenziosa — meglio un errore esplicito che perdere il collegamento atleta↔slot.
  const today = new Date().toISOString().slice(0, 10);
  const { data: activeAssignments } = await supabase
    .from('assignments')
    .select('id')
    .eq('recurring_slot_id', params.id)
    .or(`active_to.is.null,active_to.gte.${today}`);

  if (activeAssignments && activeAssignments.length > 0) {
    return NextResponse.json(
      { error: `${activeAssignments.length} atleta/i sono ancora assegnati a questo slot. Rimuovili prima di eliminarlo.` },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('recurring_slots').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
