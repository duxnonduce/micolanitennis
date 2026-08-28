import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AgendaBoard from './agenda-board';

export const revalidate = 0;

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default async function AgendaPage({ searchParams }: { searchParams: { data?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/accedi?next=/agenda');

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (!profile || !['coach', 'secretary', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/');
  }
  const isStaff = ['secretary', 'admin', 'superadmin'].includes(profile.role);

  const date = searchParams.data ?? new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  let query = supabase
    .from('lessons')
    .select(
      '*, recurring_slots(day_of_week, start_time, duration_minutes, courts(name), groups(name, courses(name))), bookings(*, athletes(first_name, last_name))'
    )
    .eq('lesson_date', date);

  if (!isStaff) query = query.eq('coach_id', user.id);

  const { data: lessons } = await query;

  // Ordina per orario
  const sorted = (lessons ?? []).sort((a: any, b: any) =>
    a.recurring_slots.start_time.localeCompare(b.recurring_slots.start_time)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-brand-blue">Agenda</h1>
      <p className="mb-6 text-gray-500">{profile.full_name}{isStaff ? ' · vista completa (staff)' : ''}</p>

      <form className="mb-6 flex items-center gap-3">
        <input type="date" name="data" defaultValue={date} className="input max-w-xs" />
        <button type="submit" className="btn-secondary !px-4 !py-2 text-sm">Vai</button>
      </form>

      <p className="mb-4 text-sm font-medium text-gray-500">{DAY_NAMES[dayOfWeek]} {new Date(date + 'T00:00:00').toLocaleDateString('it-IT')}</p>

      {sorted.length === 0 && <p className="text-gray-400">Nessuna lezione in programma.</p>}

      <AgendaBoard lessons={sorted} />
    </div>
  );
}
