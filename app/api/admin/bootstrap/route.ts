import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Crea un account staff (secretary/admin/superadmin) SENZA passare dal questionario pubblico.
 * Protetto da ADMIN_BOOTSTRAP_SECRET (env var, non nel client). Chi conosce il secret può
 * creare account staff — impostalo su una stringa lunga e casuale e non condividerlo mai
 * nel codice o in chat pubbliche.
 */
export async function POST(req: Request) {
  const { secret, email, password, fullName, role } = await req.json();

  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Codice di sicurezza non valido.' }, { status: 403 });
  }

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Dati mancanti.' }, { status: 400 });
  }
  const finalRole = ['secretary', 'admin', 'superadmin', 'coach'].includes(role) ? role : 'secretary';

  const service = createServiceClient();

  const { data: userData, error: userErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !userData.user) {
    return NextResponse.json(
      { error: userErr?.message ?? 'Impossibile creare l\'account. Email già registrata?' },
      { status: 400 }
    );
  }

  const { error: profileErr } = await service.from('profiles').insert({
    id: userData.user.id,
    role: finalRole,
    full_name: fullName,
    email,
  });
  if (profileErr) {
    return NextResponse.json({ error: 'Account creato ma errore nel profilo: ' + profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: finalRole });
}
