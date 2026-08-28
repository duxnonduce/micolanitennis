import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { formatEuro } from '@/lib/pricing';
import RequestActions from './actions';

export const revalidate = 0;

export default async function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/accedi?next=/admin/richieste');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) redirect('/');

  const { data: request } = await supabase
    .from('requests')
    .select('*, courses(name), athletes(*), request_installments(*)')
    .eq('id', params.id)
    .single();

  if (!request) notFound();

  const { data: consents } = await supabase
    .from('consents')
    .select('*')
    .eq('athlete_id', request.athletes.id);

  // Gruppi/slot disponibili per questo corso, con conteggio occupazione per capacità
  const { data: groups } = await supabase
    .from('groups')
    .select('*, recurring_slots(*, courts(name)), levels(name)')
    .eq('course_id', request.course_id);

  const today = new Date().toISOString().slice(0, 10);
  const slotIds = (groups ?? []).flatMap((g: any) => g.recurring_slots.map((s: any) => s.id));
  const { data: activeAssignments } = slotIds.length
    ? await supabase
        .from('assignments')
        .select('recurring_slot_id')
        .in('recurring_slot_id', slotIds)
        .or(`active_to.is.null,active_to.gte.${today}`)
    : { data: [] as any[] };

  const occupancyBySlot: Record<string, number> = {};
  (activeAssignments ?? []).forEach((a: any) => {
    occupancyBySlot[a.recurring_slot_id] = (occupancyBySlot[a.recurring_slot_id] ?? 0) + 1;
  });

  const candidateSlots = (groups ?? []).flatMap((g: any) =>
    g.recurring_slots.map((s: any) => ({
      id: s.id,
      groupName: g.name,
      groupId: g.id,
      levelName: g.levels?.name ?? null,
      maxCapacity: g.max_capacity,
      occupied: occupancyBySlot[s.id] ?? 0,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      durationMinutes: s.duration_minutes,
      courtName: s.courts?.name,
    }))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <a href="/admin/richieste" className="text-sm text-brand-blue">&larr; Coda richieste</a>
      <h1 className="mt-2 text-2xl font-bold text-brand-blue">
        {request.athletes.first_name} {request.athletes.last_name}
      </h1>
      <p className="text-gray-500">{request.courses.name} · {request.weekly_frequency}x a settimana</p>

      <div className="card mt-6 space-y-2 text-sm">
        <p><strong>Data di nascita:</strong> {new Date(request.athletes.birth_date).toLocaleDateString('it-IT')}</p>
        <p><strong>Codice fiscale:</strong> {request.athletes.fiscal_code ?? '—'}</p>
        <p><strong>Data di ingresso richiesta:</strong> {new Date(request.entry_date).toLocaleDateString('it-IT')}</p>
        <p><strong>Ingresso tardivo (riproporzionato):</strong> {request.is_late_entry ? 'Sì' : 'No'}</p>
        <p><strong>Note/preferenze:</strong> {request.notes || '—'}</p>
        <p><strong>Consensi registrati:</strong> {(consents ?? []).map((c: any) => c.consent_type).join(', ') || 'nessuno'}</p>
      </div>

      <div className="card mt-6">
        <h2 className="mb-3 font-semibold text-brand-blueDark">Piano pagamenti</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">Rata</th>
              <th className="py-1">Importo</th>
              <th className="py-1">Scadenza</th>
              <th className="py-1">Stato</th>
            </tr>
          </thead>
          <tbody>
            {request.request_installments
              .sort((a: any, b: any) => a.installment_index - b.installment_index)
              .map((i: any) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-1">Rata {i.installment_index}</td>
                  <td className="py-1">{formatEuro(i.amount)}</td>
                  <td className="py-1">{new Date(i.due_date).toLocaleDateString('it-IT')}</td>
                  <td className="py-1 capitalize">{i.status.replace('_', ' ')}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="mt-2 text-right font-semibold text-brand-blue">
          Totale: {formatEuro(request.computed_total)}
        </p>
      </div>

      <RequestActions
        requestId={request.id}
        currentStatus={request.status}
        weeklyFrequency={request.weekly_frequency}
        candidateSlots={candidateSlots}
        athleteLevelId={request.athletes.level_id}
      />
    </div>
  );
}
