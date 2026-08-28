import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/planning';
import PlanningBoard from './planning-board';
import RegenerateButton from './regenerate-button';
import WeeklyGrid from './weekly-grid';

export const revalidate = 0;

export default async function PianificazionePage() {
  await requireStaff();
  const supabase = createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, category')
    .eq('is_active', true)
    .order('name');

  const { data: levels } = await supabase.from('levels').select('*').order('numeric_value');
  const { data: courts } = await supabase.from('courts').select('*').order('display_order');
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'coach')
    .order('full_name');

  const today = new Date().toISOString().slice(0, 10);
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select(
      '*, courses(name, category), recurring_slots(*, courts(name), assignments(athlete_id, active_to, athletes(first_name, last_name)))'
    )
    .order('name');

  if (groupsError) {
    console.error('Errore nel caricamento gruppi:', groupsError.message);
  }

  const groupsByCourse: Record<string, any[]> = {};
  (groups ?? []).forEach((g: any) => {
    if (!groupsByCourse[g.course_id]) groupsByCourse[g.course_id] = [];
    groupsByCourse[g.course_id].push(g);
  });

  // Appiattisce tutti gli slot con le info che servono alla griglia (categoria, colore, atleti attivi)
  const flatSlots = (groups ?? []).flatMap((g: any) =>
    (g.recurring_slots ?? []).map((s: any) => {
      const athleteNames = (s.assignments ?? [])
        .filter((a: any) => !a.active_to || a.active_to >= today)
        .map((a: any) => `${a.athletes.first_name} ${a.athletes.last_name.charAt(0)}.`);
      return {
        id: s.id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        durationMinutes: s.duration_minutes,
        courtId: s.court_id,
        courtName: s.courts?.name,
        groupId: g.id,
        groupName: g.name,
        maxCapacity: g.max_capacity,
        courseId: g.course_id,
        courseName: g.courses?.name,
        courseCategory: g.courses?.category,
        defaultCoachId: s.default_coach_id,
        athleteNames,
      };
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-brand-blue">Pianificazione</h1>
      <p className="mb-6 text-gray-600">
        Clicca su una cella vuota per posizionare un gruppo. Clicca su un blocco per vedere i
        dettagli, assegnare il maestro o rimuoverlo. I nomi compaiono automaticamente man mano
        che le iscrizioni vengono approvate.
      </p>

      <RegenerateButton />

      <div className="mt-6">
        <WeeklyGrid
          courts={courts ?? []}
          slots={flatSlots}
          groupsByCourse={groupsByCourse}
          coaches={coaches ?? []}
          courses={courses ?? []}
        />
      </div>

      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium text-brand-blue">
          Gestisci gruppi (crea/elimina gruppi per corso)
        </summary>
        <div className="mt-4">
          <PlanningBoard
            courses={courses ?? []}
            levels={levels ?? []}
            courts={courts ?? []}
            coaches={coaches ?? []}
            groupsByCourse={groupsByCourse}
          />
        </div>
      </details>
    </div>
  );
}
