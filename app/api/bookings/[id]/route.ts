import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['confermata', 'presente', 'assente', 'cancellata'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Stato non valido.' }, { status: 400 });
  }

  // La RLS fa comunque da ultima linea di difesa (staff o maestro titolare della lezione),
  // qui usiamo il client con sessione utente così la policy si applica correttamente.
  const { error } = await supabase.from('bookings').update({ status }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });

  return NextResponse.json({ ok: true });
}
