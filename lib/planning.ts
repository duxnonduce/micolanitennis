import { createClient as createServerAuthClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export function formatTime(t: string) {
  // t arriva come "19:00:00" da Postgres time
  return t.slice(0, 5);
}

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

/**
 * Conta gli atleti attualmente assegnati a uno slot ricorrente (assignment attivo, active_to nullo o futuro).
 */
export function countOccupancy(assignments: { active_to: string | null }[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return assignments.filter((a) => !a.active_to || a.active_to >= today).length;
}
