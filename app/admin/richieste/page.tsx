import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatEuro } from '@/lib/pricing';

export const revalidate = 0;

const STATUS_OPTIONS = [
  'in_attesa',
  'in_verifica',
  'da_integrare',
  'approvata',
  'rifiutata',
  'annullata',
];

export default async function AdminRichiestePage({
  searchParams,
}: {
  searchParams: { status?: string; corso?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/accedi?next=/admin/richieste');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['secretary', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/');
  }

  const statusFilter = searchParams.status ?? 'in_attesa';

  let query = supabase
    .from('requests')
    .select('*, athletes(first_name, last_name), courses(name)')
    .order('created_at', { ascending: true });

  if (statusFilter !== 'tutte') query = query.eq('status', statusFilter);
  if (searchParams.corso) query = query.eq('course_id', searchParams.corso);

  const { data: requests } = await query;
  const { data: courses } = await supabase.from('courses').select('id, name');

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-blue">Coda richieste</h1>

      <div className="mb-4">
        <a href="/admin/pianificazione" className="text-sm font-medium text-brand-blue">
          → Vai alla Pianificazione (gruppi, campi, slot)
        </a>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/admin/richieste?status=tutte"
          className={`rounded-full px-3 py-1 text-sm ${statusFilter === 'tutte' ? 'bg-brand-blue text-white' : 'bg-gray-100'}`}
        >
          Tutte
        </a>
        {STATUS_OPTIONS.map((s) => (
          <a
            key={s}
            href={`/admin/richieste?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              statusFilter === s ? 'bg-brand-blue text-white' : 'bg-gray-100'
            }`}
          >
            {s.replace('_', ' ')}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Atleta</th>
              <th className="py-2 pr-4">Corso</th>
              <th className="py-2 pr-4">Freq.</th>
              <th className="py-2 pr-4">Ingresso</th>
              <th className="py-2 pr-4">Totale</th>
              <th className="py-2 pr-4">Stato</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{r.athletes?.first_name} {r.athletes?.last_name}</td>
                <td className="py-2 pr-4">{r.courses?.name}</td>
                <td className="py-2 pr-4">{r.weekly_frequency}x</td>
                <td className="py-2 pr-4">{new Date(r.entry_date).toLocaleDateString('it-IT')}</td>
                <td className="py-2 pr-4">{formatEuro(r.computed_total)}</td>
                <td className="py-2 pr-4 capitalize">{r.status.replace('_', ' ')}</td>
                <td className="py-2">
                  <a href={`/admin/richieste/${r.id}`} className="text-brand-blue font-medium">
                    Apri →
                  </a>
                </td>
              </tr>
            ))}
            {(requests ?? []).length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">Nessuna richiesta.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
