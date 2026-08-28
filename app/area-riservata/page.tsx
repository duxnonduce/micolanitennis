import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatEuro } from '@/lib/pricing';

export const revalidate = 0;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  bozza: { label: 'Bozza', color: 'bg-gray-100 text-gray-600' },
  in_attesa: { label: 'In attesa', color: 'bg-amber-100 text-amber-700' },
  in_verifica: { label: 'In verifica', color: 'bg-blue-100 text-blue-700' },
  da_integrare: { label: 'Da integrare', color: 'bg-orange-100 text-orange-700' },
  approvata: { label: 'Approvata', color: 'bg-green-100 text-green-700' },
  rifiutata: { label: 'Rifiutata', color: 'bg-red-100 text-red-700' },
  annullata: { label: 'Annullata', color: 'bg-gray-100 text-gray-500' },
};

export default async function AreaRiservataPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/accedi?next=/area-riservata');

  // Atleti collegati a questo account (come genitore o come atleta stesso)
  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .or(`guardian_profile_id.eq.${user.id},profile_id.eq.${user.id}`);

  const athleteIds = (athletes ?? []).map((a) => a.id);

  const { data: requests } = athleteIds.length
    ? await supabase
        .from('requests')
        .select('*, courses(name), request_installments(*)')
        .in('athlete_id', athleteIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-blue">Area riservata</h1>

      {(requests ?? []).length === 0 && (
        <p className="text-gray-500">Nessuna richiesta al momento.</p>
      )}

      <div className="space-y-6">
        {(requests ?? []).map((r: any) => {
          const status = STATUS_LABELS[r.status] ?? STATUS_LABELS.in_attesa;
          return (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-brand-blueDark">{r.courses?.name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {r.weekly_frequency}x a settimana · ingresso {new Date(r.entry_date).toLocaleDateString('it-IT')}
              </p>

              {r.status === 'in_attesa' && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  La tua richiesta è in gestione. Riceverai una email non appena la segreteria
                  avrà assegnato giorno e orario.
                </p>
              )}
              {r.status === 'da_integrare' && r.user_message && (
                <p className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                  {r.user_message}
                </p>
              )}

              {r.request_installments?.length > 0 && (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-1">Rata</th>
                      <th className="py-1">Importo</th>
                      <th className="py-1">Scadenza</th>
                      <th className="py-1">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.request_installments
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
