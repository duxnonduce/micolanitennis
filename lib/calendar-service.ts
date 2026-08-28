import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Genera tutte le date di una stagione che cadono in un certo giorno della settimana,
 * escludendo gli intervalli di chiusura.
 */
function getSeasonLessonDates(
  startDate: string,
  endDate: string,
  dayOfWeek: number,
  closures: { date_from: string; date_to: string }[]
): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (cursor <= end) {
    if (cursor.getDay() === dayOfWeek) {
      const iso = cursor.toISOString().slice(0, 10);
      const inClosure = closures.some((c) => iso >= c.date_from && iso <= c.date_to);
      if (!inClosure) dates.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/**
 * (Ri)genera il calendario di un singolo slot ricorrente:
 *  1. crea le istanze in `lessons` per ogni data della stagione (saltando le chiusure)
 *  2. crea le prenotazioni in `bookings` per ogni atleta attualmente assegnato allo slot,
 *     limitate al periodo di validità della sua assignment (active_from / active_to)
 *
 * È idempotente e SICURA da rilanciare più volte: usa ignoreDuplicates, quindi non
 * sovrascrive mai lezioni già modificate a mano (cambio maestro/campo su una singola
 * data) né presenze già segnate.
 */
export async function regenerateSlotCalendar(service: SupabaseClient, slotId: string) {
  const { data: slot, error: slotErr } = await service
    .from('recurring_slots')
    .select('*, groups(course_id, courses(start_date, end_date, season_id))')
    .eq('id', slotId)
    .single();
  if (slotErr || !slot) throw new Error('Slot non trovato: ' + slotErr?.message);

  const course = (slot as any).groups.courses;
  const { data: closures } = await service
    .from('season_closures')
    .select('date_from, date_to')
    .eq('season_id', course.season_id);

  const dates = getSeasonLessonDates(course.start_date, course.end_date, slot.day_of_week, closures ?? []);
  if (dates.length === 0) return { lessonsCreated: 0, bookingsCreated: 0 };

  // 1. Crea le lezioni mancanti (quelle già esistenti vengono ignorate, non toccate)
  const lessonRows = dates.map((d) => ({
    recurring_slot_id: slotId,
    lesson_date: d,
    coach_id: slot.default_coach_id ?? null,
  }));
  await service
    .from('lessons')
    .upsert(lessonRows, { onConflict: 'recurring_slot_id,lesson_date', ignoreDuplicates: true });

  // 2. Recupera gli id di TUTTE le lezioni dello slot in queste date (nuove + già esistenti)
  const { data: lessons } = await service
    .from('lessons')
    .select('id, lesson_date')
    .eq('recurring_slot_id', slotId)
    .in('lesson_date', dates);

  const lessonIdByDate: Record<string, string> = {};
  (lessons ?? []).forEach((l: any) => (lessonIdByDate[l.lesson_date] = l.id));

  // 3. Prenotazioni per ogni atleta assegnato, solo nel suo periodo di validità
  const { data: assignments } = await service
    .from('assignments')
    .select('athlete_id, active_from, active_to')
    .eq('recurring_slot_id', slotId);

  const bookingRows: { lesson_id: string; athlete_id: string; source: string }[] = [];
  (assignments ?? []).forEach((a: any) => {
    dates.forEach((d) => {
      if (d < a.active_from) return;
      if (a.active_to && d > a.active_to) return;
      const lessonId = lessonIdByDate[d];
      if (!lessonId) return;
      bookingRows.push({ lesson_id: lessonId, athlete_id: a.athlete_id, source: 'assegnazione' });
    });
  });

  let bookingsCreated = 0;
  const CHUNK = 500;
  for (let i = 0; i < bookingRows.length; i += CHUNK) {
    const chunk = bookingRows.slice(i, i + CHUNK);
    const { data } = await service
      .from('bookings')
      .upsert(chunk, { onConflict: 'lesson_id,athlete_id', ignoreDuplicates: true })
      .select('id');
    bookingsCreated += data?.length ?? 0;
  }

  return { lessonsCreated: dates.length, bookingsCreated };
}
