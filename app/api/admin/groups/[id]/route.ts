import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function checkStaff(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) return null;
  return user;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await checkStaff(supabase);
  if (!user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.max_capacity !== undefined) updates.max_capacity = body.max_capacity;
  if (body.level_id !== undefined) updates.level_id = body.level_id;

  const { error } = await supabase.from('groups').update(updates).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await checkStaff(supabase);
  if (!user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });

  // I recurring_slots collegati vengono eliminati a cascata (vedi schema, on delete cascade)
  const { error } = await supabase.from('groups').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
