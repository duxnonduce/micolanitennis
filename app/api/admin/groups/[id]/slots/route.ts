import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { day_of_week, start_time, duration_minutes, court_id } = await req.json();
  if (day_of_week === undefined || !start_time || !duration_minutes || !court_id) {
    return NextResponse.json({ error: 'Dati mancanti.' }, { status: 400 });
  }

  // Verifica sovrapposizioni sullo stesso campo/giorno/orario prima di inserire
  const { data: existing } = await supabase
    .from('recurring_slots')
    .select('id, start_time, duration_minutes, group_id')
    .eq('court_id', court_id)
    .eq('day_of_week', day_of_week);

  const newStart = toMinutes(start_time);
  const newEnd = newStart + Number(duration_minutes);
  const overlap = (existing ?? []).some((s) => {
    const sStart = toMinutes(s.start_time);
    const sEnd = sStart + s.duration_minutes;
    return newStart < sEnd && sStart < newEnd;
  });
  if (overlap) {
    return NextResponse.json(
      { error: 'Questo campo è già occupato in questa fascia oraria dello stesso giorno.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('recurring_slots')
    .insert({
      group_id: params.id,
      day_of_week,
      start_time,
      duration_minutes,
      court_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
