-- ============================================================================
-- MIGRAZIONE 04 — Assegnazione maestro per slot + accesso presenze
-- Esegui questo file da Supabase SQL Editor DOPO 01/02/03 già eseguiti.
-- ============================================================================

-- Un maestro "di riferimento" per lo slot: usato come default quando si genera
-- il calendario lezioni. Resta comunque possibile cambiare il maestro sulla
-- singola lezione (lessons.coach_id) senza toccare questo valore.
alter table recurring_slots add column default_coach_id uuid references profiles(id);

-- Permetti al maestro di leggere/aggiornare le prenotazioni (per la presenza)
-- delle lezioni di cui è titolare.
create policy "coach reads own lesson bookings" on bookings for select
  using (exists (select 1 from lessons l where l.id = lesson_id and l.coach_id = auth.uid()));

create policy "coach updates own lesson bookings" on bookings for update
  using (exists (select 1 from lessons l where l.id = lesson_id and l.coach_id = auth.uid()));
