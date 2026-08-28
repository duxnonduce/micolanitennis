import { createClient as createServerAuthClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Solo funzioni SERVER-ONLY qui dentro (usano next/headers tramite lib/supabase/server).
// Le costanti/formattazioni condivise anche coi client component stanno in
// lib/planning-constants.ts — import separato apposta, per evitare che webpack
// provi a portare next/headers nel bundle del browser.

/**
 * Verifica che l'utente corrente sia loggato e abbia un ruolo staff.
 * Da chiamare in cima a ogni pagina/route admin. Fa redirect se non autorizzato.
 */
export async function requireStaff() {
  const supabase = createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/accedi?next=/admin/pianificazione');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/');
  }
  return { user, role: profile.role };
}
