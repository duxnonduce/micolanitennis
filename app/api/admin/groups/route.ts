import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
  }

  const { course_id, level_id, name, max_capacity } = await req.json();
  if (!course_id || !name || !max_capacity) {
    return NextResponse.json({ error: 'Dati mancanti.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ course_id, level_id: level_id || null, name, max_capacity })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}
