-- ============================================================================
-- ROW LEVEL SECURITY — Fase 1
-- Ruoli applicativi: visitor (non loggato), athlete/parent, coach, secretary/admin, superadmin
-- Il ruolo è letto da profiles.role (settato dal server al momento della registrazione).
-- ============================================================================

alter table profiles enable row level security;
alter table seasons enable row level security;
alter table season_closures enable row level security;
alter table courts enable row level security;
alter table levels enable row level security;
alter table courses enable row level security;
alter table course_frequencies enable row level security;
alter table price_plans enable row level security;
alter table price_installments enable row level security;
alter table registration_fees enable row level security;
alter table athletes enable row level security;
alter table consents enable row level security;
alter table requests enable row level security;
alter table request_installments enable row level security;
alter table groups enable row level security;
alter table recurring_slots enable row level security;
alter table assignments enable row level security;
alter table lessons enable row level security;
alter table bookings enable row level security;
alter table credit_ledger enable row level security;
alter table waitlist_entries enable row level security;
alter table athlete_documents enable row level security;
alter table payments enable row level security;
alter table email_log enable row level security;
alter table activity_log enable row level security;

-- Helper: ruolo dell'utente corrente
create or replace function current_role_name() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff() returns boolean as $$
  select current_role_name() in ('secretary','admin','superadmin');
$$ language sql stable security definer;

-- ---- Contenuti pubblici: lettura libera anche da non autenticati ----
create policy "public read seasons" on seasons for select using (true);
create policy "public read courts" on courts for select using (true);
create policy "public read levels" on levels for select using (true);
create policy "public read courses" on courses for select using (is_active = true or is_staff());
create policy "public read course_frequencies" on course_frequencies for select using (true);
create policy "public read price_plans" on price_plans for select using (true);
create policy "public read price_installments" on price_installments for select using (true);
create policy "public read registration_fees" on registration_fees for select using (true);

-- ---- profiles ----
create policy "user reads own profile" on profiles for select using (auth.uid() = id or is_staff());
create policy "user updates own profile" on profiles for update using (auth.uid() = id);
create policy "staff manage profiles" on profiles for all using (is_staff());

-- ---- athletes ----
create policy "guardian reads own athletes" on athletes for select
  using (guardian_profile_id = auth.uid() or profile_id = auth.uid() or is_staff());
create policy "guardian updates own athletes" on athletes for update
  using (guardian_profile_id = auth.uid() or profile_id = auth.uid() or is_staff());
create policy "guardian inserts athlete" on athletes for insert
  with check (guardian_profile_id = auth.uid() or profile_id = auth.uid());
create policy "staff manage athletes" on athletes for all using (is_staff());

-- ---- consents ----
create policy "guardian reads own consents" on consents for select
  using (guardian_profile_id = auth.uid() or is_staff());
create policy "guardian inserts consents" on consents for insert
  with check (guardian_profile_id = auth.uid());

-- ---- requests ----
create policy "owner reads own requests" on requests for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "owner inserts own requests" on requests for insert
  with check (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
  );
create policy "staff manage requests" on requests for all using (is_staff());

-- ---- request_installments ----
create policy "owner reads own installments" on request_installments for select
  using (
    exists (
      select 1 from requests r join athletes a on a.id = r.athlete_id
      where r.id = request_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid())
    ) or is_staff()
  );
create policy "staff manage installments" on request_installments for all using (is_staff());

-- ---- groups / recurring_slots: lettura pubblica per il planning, scrittura solo staff ----
create policy "public read groups" on groups for select using (true);
create policy "staff manage groups" on groups for all using (is_staff());
create policy "public read recurring_slots" on recurring_slots for select using (true);
create policy "staff manage recurring_slots" on recurring_slots for all using (is_staff());

-- ---- assignments ----
create policy "owner reads own assignments" on assignments for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "staff manage assignments" on assignments for all using (is_staff());

-- ---- lessons: lettura pubblica (serve per mostrare disponibilità), scrittura staff/coach ----
create policy "public read lessons" on lessons for select using (true);
create policy "staff manage lessons" on lessons for all using (is_staff());
create policy "coach updates own lessons" on lessons for update
  using (coach_id = auth.uid());

-- ---- bookings ----
create policy "owner reads own bookings" on bookings for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "owner manages own bookings" on bookings for insert
  with check (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
  );
create policy "owner cancels own bookings" on bookings for update
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
  );
create policy "staff manage bookings" on bookings for all using (is_staff());

-- ---- credit_ledger ----
create policy "owner reads own credits" on credit_ledger for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "staff manage credits" on credit_ledger for all using (is_staff());

-- ---- waitlist_entries ----
create policy "owner reads own waitlist" on waitlist_entries for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "owner joins waitlist" on waitlist_entries for insert
  with check (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
  );
create policy "staff manage waitlist" on waitlist_entries for all using (is_staff());

-- ---- athlete_documents ----
create policy "owner reads own documents" on athlete_documents for select
  using (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
    or is_staff()
  );
create policy "owner uploads own documents" on athlete_documents for insert
  with check (
    exists (select 1 from athletes a where a.id = athlete_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid()))
  );
create policy "staff manage documents" on athlete_documents for all using (is_staff());

-- ---- payments: solo staff scrive; il genitore legge i propri ----
create policy "owner reads own payments" on payments for select
  using (
    exists (
      select 1 from request_installments ri join requests r on r.id = ri.request_id join athletes a on a.id = r.athlete_id
      where ri.id = request_installment_id and (a.guardian_profile_id = auth.uid() or a.profile_id = auth.uid())
    ) or is_staff()
  );
create policy "staff manage payments" on payments for all using (is_staff());

-- ---- email_log / activity_log: solo staff ----
create policy "staff read email_log" on email_log for select using (is_staff());
create policy "staff read activity_log" on activity_log for select using (is_staff());

-- ---- season_closures: lettura pubblica, scrittura staff ----
create policy "public read season_closures" on season_closures for select using (true);
create policy "staff manage season_closures" on season_closures for all using (is_staff());
