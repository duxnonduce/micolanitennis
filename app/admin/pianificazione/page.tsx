import { createClient } from '@/lib/supabase/server';
import { requireStaff, countOccupancy } from '@/lib/planning';
import PlanningBoard from './planning-board';

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

  const { data: groups } = await supabase
    .from('groups')
    .select('*, recurring_slots(*, courts(name)), assignments(active_to)')
    .order('name');

  const groupsByCourse: Record<string, any[]> = {};
  (groups ?? []).forEach((g: any) => {
    const occupancyBySlot: Record<string, number> = {};
    // Nota: assignments qui è relativo al gruppo tramite recurring_slot_id -> serve rifetch mirato,
    // per semplicità in questa vista mostriamo il conteggio a livello di singolo slot lato client.
    if (!groupsByCourse[g.course_id]) groupsByCourse[g.course_id] = [];
    groupsByCourse[g.course_id].push(g);
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-brand-blue">Pianificazione</h1>
      <p className="mb-8 text-gray-600">
        Crea i gruppi per ogni corso e posizionali nel modello settimanale (giorno, ora, campo).
        Questo è il modello generale — non contiene i nomi degli atleti.
      </p>

      <PlanningBoard
        courses={courses ?? []}
        levels={levels ?? []}
        courts={courts ?? []}
        groupsByCourse={groupsByCourse}
      />
    </div>
  );
}
