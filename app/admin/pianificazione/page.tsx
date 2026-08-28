import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/planning';
import PlanningBoard from './planning-board';
import RegenerateButton from './regenerate-button';

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

  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*, recurring_slots(*, courts(name))')
    .order('name');

  if (groupsError) {
    console.error('Errore nel caricamento gruppi:', groupsError.message);
  }

  const groupsByCourse: Record<string, any[]> = {};
  (groups ?? []).forEach((g: any) => {
    if (!groupsByCourse[g.course_id]) groupsByCourse[g.course_id] = [];
    groupsByCourse[g.course_id].push(g);
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-brand-blue">Pianificazione</h1>
      <p className="mb-6 text-gray-600">
        Crea i gruppi per ogni corso e posizionali nel modello settimanale (giorno, ora, campo).
        Questo è il modello generale — non contiene i nomi degli atleti.
      </p>

      <RegenerateButton />

      <div className="mt-6">
        <PlanningBoard
          courses={courses ?? []}
          levels={levels ?? []}
          courts={courts ?? []}
          coaches={coaches ?? []}
          groupsByCourse={groupsByCourse}
        />
      </div>
    </div>
  );
}
