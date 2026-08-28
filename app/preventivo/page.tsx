import { createClient } from '@/lib/supabase/server';
import PreventivoWizard from './wizard';

export const revalidate = 0;

export default async function PreventivoPage({
  searchParams,
}: {
  searchParams: { corso?: string };
}) {
  const supabase = createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select(
      '*, course_frequencies(weekly_frequency), price_plans(*, price_installments(*))'
    )
    .eq('is_active', true);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-blue">Richiedi un preventivo</h1>
      <PreventivoWizard courses={courses ?? []} preselectedCourseId={searchParams.corso} />
    </div>
  );
}
