import { createClient } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/pricing';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*, course_frequencies(weekly_frequency)')
    .eq('id', params.id)
    .single();

  if (!course) notFound();

  const { data: plans } = await supabase
    .from('price_plans')
    .select('*, price_installments(*)')
    .eq('course_id', params.id)
    .order('weekly_frequency')
    .order('num_installments');

  const frequencies = (course.course_frequencies ?? [])
    .map((f: any) => f.weekly_frequency)
    .sort((a: number, b: number) => a - b);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <a href="/corsi" className="text-sm text-brand-blue">&larr; Tutti i corsi</a>
      <h1 className="mt-2 text-3xl font-extrabold text-brand-blue">{course.name}</h1>
      <p className="mt-1 text-gray-500">
        {course.age_min && course.age_max
          ? `${course.age_min}-${course.age_max} anni`
          : course.age_min
          ? `${course.age_min}+ anni`
          : ''}
        {' · '}
        {new Date(course.start_date).toLocaleDateString('it-IT')} –{' '}
        {new Date(course.end_date).toLocaleDateString('it-IT')}
      </p>

      <div className="card mt-6">
        <h2 className="mb-2 font-semibold text-brand-blueDark">Durata della seduta</h2>
        <p className="text-gray-700">
          {course.lesson_tennis_minutes} minuti di tennis
          {course.lesson_athletic_minutes > 0 && ` + ${course.lesson_athletic_minutes} minuti di preparazione atletica`}
        </p>
        {course.coach_ratio?.startsWith('ratio:') && (
          <p className="mt-1 text-sm text-gray-500">
            Rapporto maestro:atleti {course.coach_ratio.replace('ratio:', '')}
          </p>
        )}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <h2 className="mb-4 font-semibold text-brand-blueDark">Listino</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Frequenza</th>
              <th className="py-2 pr-4">Rate</th>
              <th className="py-2 pr-4">Totale</th>
            </tr>
          </thead>
          <tbody>
            {(plans ?? []).map((p: any) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{p.weekly_frequency}x a settimana</td>
                <td className="py-2 pr-4">
                  {p.num_installments === 1
                    ? 'Pagamento unico'
                    : `${p.num_installments} rate`}
                  {p.is_ordinary_price && (
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      prezzo ordinario
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 font-medium">{formatEuro(p.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-gray-500">
          A questi importi si aggiunge la quota d'iscrizione di 100€ (kit abbigliamento + tessera FITP non agonistica).
        </p>
      </div>

      <a
        href={`/preventivo?corso=${course.id}`}
        className="btn-primary mt-8 inline-block"
      >
        Richiedi un preventivo per questo corso
      </a>
    </div>
  );
}
