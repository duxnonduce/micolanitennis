-- ============================================================================
-- MICOLANI TENNIS — GESTIONALE
-- Schema dati core (Fase 1 + fondamenta Fase 2/3/4)
-- Target: Supabase (Postgres 15+)
-- ============================================================================
-- Convenzioni:
--   - id: uuid, default gen_random_uuid()
--   - created_at/updated_at su tabelle transazionali
--   - enum via CHECK constraint testuale (più semplice da modificare da SQL Editor
--     rispetto a un vero ENUM Postgres, che richiede ALTER TYPE per ogni modifica)
--   - RLS: abilitata su tutte le tabelle esposte al client, policy da definire
--     nel file 02_rls.sql quando iniziamo la Fase 1 applicativa
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. RUOLI E UTENTI
-- ============================================================================

-- Estende auth.users di Supabase con dati applicativi e ruolo
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('visitor','athlete','parent','coach','secretary','admin','superadmin')),
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table profiles is 'Estende auth.users con ruolo e dati anagrafici base. Un genitore e un maestro sono entrambi profiles con role diverso.';

-- ============================================================================
-- 2. STAGIONE E CONFIGURAZIONE ANNUALE
-- ============================================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,                          -- es. "Stagione 2026/2027"
  start_date date not null,                     -- default stagione: 14 set 2026
  end_date date not null,                       -- default stagione: 11 lug 2027
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table seasons is 'Contenitore annuale. Le date qui sono il default: ogni corso può sovrascriverle (vedi courses.start_date/end_date) — necessario perché in pratica un corso può avere calendario diverso dagli altri.';

-- Chiusure, festività, eccezioni al calendario della stagione
create table season_closures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  date_from date not null,
  date_to date not null,
  reason text,                                   -- es. "Festività natalizie"
  created_at timestamptz not null default now()
);
comment on table season_closures is 'Intervalli di chiusura usati dal generatore di lezioni ricorrenti per escludere date.';

-- ============================================================================
-- 3. CAMPI
-- ============================================================================

create table courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,                            -- es. "Campo 1", "Campo coperto"
  is_covered boolean not null default false,
  surface text check (surface in ('terra_battuta','cemento','erba_sintetica','altro')),
  is_active boolean not null default true,
  display_order int not null default 0
);
comment on table courts is 'Elenco fisico dei campi disponibili (6 attuali + il nuovo campo coperto quando pronto).';

-- ============================================================================
-- 4. LIVELLI
-- ============================================================================

create table levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,                            -- nome visibile, es. "Livello 2"
  numeric_value int not null,                     -- 1 = più alto, 5 = più basso (da capitolato §16.4)
  category text,                                  -- opzionale: scope per categoria (es. "adulti", "agonistico")
  unique (numeric_value, category)
);
comment on table levels is 'Scala di riferimento: 1 più alto, 5 più basso. Usata per compatibilità recuperi (proprio livello + inferiori + max 1 superiore).';

-- ============================================================================
-- 5. CORSI (prodotto commerciale)
-- ============================================================================

create table courses (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete restrict,
  category text not null check (category in (
    'baby','avviamento','agonistico','agonistico_pro','adulti_avviamento','adulti_pro'
  )),
  name text not null,                             -- es. "Corso Baby Tennis"
  age_min int,                                    -- null = nessun minimo (es. adulti solo max)
  age_max int,
  description text,
  -- Ogni corso ha le proprie date, anche se nella stagione 2026/27 coincidono tutte con la stagione
  start_date date not null,
  end_date date not null,
  -- Durata lezione: per agonistico/agonistico_pro la seduta è divisa tennis+atletica
  lesson_tennis_minutes int not null,
  lesson_athletic_minutes int not null default 0,  -- 0 se non previsto (baby, avviamento, adulti)
  -- Rapporto maestro:atleti — 'group' oppure 'ratio:X:Y' es. per Agonistico Pro è 1:2
  coach_ratio text not null default 'group',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table courses is 'Prodotto commerciale venduto. lesson_tennis_minutes + lesson_athletic_minutes = durata seduta totale. Il gettone di recupero copre SOLO la parte tennis (vedi credit_ledger).';

-- Frequenze settimanali consentite per ciascun corso (es. Baby solo 1x, Agonistico 2-5x)
create table course_frequencies (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  weekly_frequency int not null check (weekly_frequency between 1 and 5),
  unique (course_id, weekly_frequency)
);

-- ============================================================================
-- 6. LISTINI (prezzi per corso + frequenza + numero rate)
-- ============================================================================

create table price_plans (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  weekly_frequency int not null,
  num_installments int not null check (num_installments >= 1),
  total_amount numeric(10,2) not null,             -- somma di tutte le rate di questo piano
  -- Data entro cui questo piano è ancora "agevolato" (rilevante per 1 e 2 rate).
  -- Il prezzo ordinario (piano con più rate, tipicamente 3) resta sempre disponibile.
  early_bird_deadline date,
  is_ordinary_price boolean not null default false, -- true = piano di riferimento per il riproporzionamento (§7.3)
  created_at timestamptz not null default now(),
  unique (course_id, weekly_frequency, num_installments)
);
comment on table price_plans is 'Un piano per ogni combinazione corso+frequenza+rate. is_ordinary_price=true identifica il totale più alto, usato come base per il riproporzionamento ingresso tardivo.';

create table price_installments (
  id uuid primary key default gen_random_uuid(),
  price_plan_id uuid not null references price_plans(id) on delete cascade,
  installment_index int not null,                  -- 1, 2, 3...
  amount numeric(10,2) not null,
  due_date date,                                    -- scadenza standard di stagione (es. 20/09, 20/12, 21/03)
  unique (price_plan_id, installment_index)
);

-- Quota d'iscrizione: separata, non riproporzionata, si somma al primo importo dovuto
create table registration_fees (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade, -- null = vale per tutta la stagione
  amount numeric(10,2) not null default 100.00,
  description text,                                 -- es. "Kit abbigliamento Adidas + Tessera FITP non agonistica"
  is_active boolean not null default true
);

-- ============================================================================
-- 7. ANAGRAFICHE: ATLETI E GENITORI/TUTORI
-- ============================================================================

create table athletes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null, -- null se l'atleta minorenne non ha login proprio
  guardian_profile_id uuid references profiles(id) on delete set null, -- genitore/tutore responsabile
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  fiscal_code text,
  level_id uuid references levels(id),
  household_key text,                               -- chiave libera per raggruppare nucleo familiare (uso manuale segreteria, §sconto family)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table athletes is 'household_key è un campo libero (es. cognome+indirizzo) che la segreteria può valorizzare per riconoscere il nucleo familiare. Lo sconto family resta però applicato manualmente, non in automatico.';

-- ============================================================================
-- 8. CONSENSI (privacy, regolamento, uso immagini)
-- ============================================================================

create table consents (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athletes(id) on delete cascade,
  guardian_profile_id uuid references profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('privacy','trattamento_dati','regolamento','uso_immagini')),
  version text not null,
  accepted_at timestamptz not null default now()
);

-- ============================================================================
-- 9. RICHIESTE (preventivo → iscrizione)
-- ============================================================================

create table requests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  course_id uuid not null references courses(id) on delete restrict,
  weekly_frequency int not null,
  entry_date date not null,                          -- "Quando vuoi iniziare?"
  notes text,                                         -- note/preferenze — solo informativo, non vincolante
  chosen_installments int not null,                   -- quante rate ha scelto l'utente
  price_plan_id uuid references price_plans(id),      -- piano usato per il calcolo (se ingresso puntuale)
  is_late_entry boolean not null default false,
  computed_total numeric(10,2),                       -- totale calcolato (riproporzionato se late entry)
  status text not null default 'in_attesa' check (status in (
    'bozza','in_attesa','in_verifica','da_integrare','approvata','rifiutata','annullata'
  )),
  internal_note text,                                 -- motivazione interna segreteria
  user_message text,                                  -- messaggio mostrato all'utente (es. richiesta integrazione)
  family_discount_applied boolean not null default false, -- flag manuale segreteria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id)
);
comment on table requests is 'Nucleo del flusso preventivo→iscrizione. Stati come da capitolato §8. Una request genera, se approvata, N assignments (una per frequenza acquistata).';

-- Piano rate effettivo della richiesta (snapshot, può differire dal price_plan standard
-- per correzioni segreteria o riproporzionamento ingresso tardivo — §7.4)
create table request_installments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  installment_index int not null,
  amount numeric(10,2) not null,
  due_date date not null,
  status text not null default 'da_pagare' check (status in (
    'non_dovuta','da_pagare','in_verifica','pagata','scaduta','annullata'
  )),
  corrected_by uuid references profiles(id),          -- se la segreteria ha corretto importo/scadenza
  corrected_note text,
  created_at timestamptz not null default now(),
  unique (request_id, installment_index)
);
comment on table request_installments is 'Regola §7.4: rate con scadenza già passata al momento dell approvazione diventano pagabili entro 7 giorni; qui viene fissata la due_date effettiva, già corretta.';

-- ============================================================================
-- 10. GRUPPI, SLOT RICORRENTI, ASSEGNAZIONI (modello organizzativo §9)
-- ============================================================================

create table groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  level_id uuid references levels(id),
  name text not null,                                 -- es. "Adulti categoria 2"
  max_capacity int not null,
  created_at timestamptz not null default now()
);
comment on table groups is 'Insieme organizzativo omogeneo. NON è un corso: un gruppo può avere più slot ricorrenti (giorni diversi) senza che ogni atleta partecipi a tutti.';

create table recurring_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=domenica ... 6=sabato
  start_time time not null,
  duration_minutes int not null,
  court_id uuid not null references courts(id),
  created_at timestamptz not null default now()
);
comment on table recurring_slots is 'Posizione del gruppo nel modello settimanale: giorno+ora+durata+campo. Il modello generale NON contiene maestri fissi — associati per data (vedi lessons.coach_id).';

-- Collegamento stabile atleta ↔ slot ricorrente, generato dall approvazione di una request
create table assignments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  recurring_slot_id uuid not null references recurring_slots(id) on delete restrict,
  request_id uuid references requests(id) on delete set null,
  active_from date not null,
  active_to date,                                     -- null = fino a fine corso
  created_at timestamptz not null default now()
);
comment on table assignments is 'Un atleta con 2 frequenze ha 2 righe qui, potenzialmente su gruppi diversi (vedi esempio §11 del capitolato).';

-- ============================================================================
-- 11. LEZIONI E PRENOTAZIONI (istanze reali)
-- ============================================================================

create table lessons (
  id uuid primary key default gen_random_uuid(),
  recurring_slot_id uuid not null references recurring_slots(id) on delete cascade,
  lesson_date date not null,
  -- Override rispetto al modello generale: valorizzati solo se diversi dallo slot standard
  court_id uuid references courts(id),
  start_time time,
  duration_minutes int,
  coach_id uuid references profiles(id),               -- assegnato per singola data, può cambiare a settimana
  status text not null default 'programmata' check (status in (
    'programmata','modificata','annullata','svolta'
  )),
  credit_cost int not null default 1,                   -- costo in gettoni per un recupero su questa lezione (§16.3)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_slot_id, lesson_date)
);
comment on table lessons is 'Istanza generata dal recurring_slot. Modifiche qui (spostamento, cambio campo/maestro) non toccano il modello generale (§13).';

create table bookings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  source text not null check (source in ('assegnazione','recupero','lista_attesa')),
  status text not null default 'confermata' check (status in (
    'confermata','cancellata','presente','assente'
  )),
  credit_ledger_id uuid,                                -- valorizzato se la prenotazione ha usato un gettone (FK sotto)
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (lesson_id, athlete_id)
);
comment on table bookings is 'Partecipazione dell atleta a una lezione. source distingue presenza "stabile" da assegnazione, da recupero con gettone, da promozione lista attesa.';

-- ============================================================================
-- 12. CREDITI / GETTONI (borsellino)
-- ============================================================================

create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  quantity int not null,                                -- positivo = accredito, negativo = utilizzo/scadenza
  reason text not null,                                  -- es. "Cancellazione tempestiva lezione 12/10", causale obbligatoria per correzioni manuali
  source text not null check (source in ('cancellazione','correzione_admin','scadenza','utilizzo')),
  related_lesson_id uuid references lessons(id),         -- lezione da cui è nato il credito, se applicabile
  related_booking_id uuid references bookings(id),       -- prenotazione di recupero dove è stato speso, se applicabile
  operator_id uuid references profiles(id),               -- chi ha generato/corretto (null = automatico)
  expires_at date,
  created_at timestamptz not null default now()
);
comment on table credit_ledger is 'Storico non cancellabile. Il saldo atleta = somma di quantity. I gettoni coprono SOLO recuperi della parte tennis, non della parte atletica (decisione presa con Mattia).';

alter table bookings
  add constraint bookings_credit_ledger_fk
  foreign key (credit_ledger_id) references credit_ledger(id);

-- ============================================================================
-- 13. LISTA D'ATTESA
-- ============================================================================

create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  status text not null default 'in_attesa' check (status in (
    'in_attesa','promosso','saltato','ritirato'
  )),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text                                    -- motivazione se saltato (livello incompatibile, credito insufficiente...)
);
comment on table waitlist_entries is 'Ordine cronologico per lesson_id + created_at. §17: alla liberazione di un posto si scorre in ordine, si salta chi non ha requisiti, si conferma il primo idoneo.';

-- ============================================================================
-- 14. DOCUMENTI: CERTIFICATO MEDICO E FITP
-- ============================================================================

create table athlete_documents (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  doc_type text not null check (doc_type in ('certificato_agonistico','certificato_non_agonistico','tessera_fitp')),
  file_url text,
  fitp_number text,                                       -- se doc_type = tessera_fitp
  status text not null default 'mancante' check (status in (
    'mancante','caricato','in_verifica','approvato','rifiutato','scaduto'
  )),
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 15. PAGAMENTI
-- ============================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  request_installment_id uuid not null references request_installments(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null check (method in ('iban','paypal','sede_carta','sede_contanti')),
  transaction_ref text,                                    -- riferimento PayPal o bonifico, se disponibile
  status text not null default 'in_verifica' check (status in (
    'in_verifica','confermato','rifiutato'
  )),
  recorded_by uuid references profiles(id),                -- segreteria che ha registrato/confermato
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table payments is 'Fase 1: nessuna riconciliazione automatica. Bonifico e "in sede" richiedono conferma manuale segreteria; PayPal può essere confermato via link/ricevuta mostrata all utente, poi verificata.';

-- ============================================================================
-- 16. COMUNICAZIONI
-- ============================================================================

create table email_log (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  template text not null,                                  -- es. "richiesta_ricevuta", "assegnazioni_confermate"
  related_entity text,                                      -- es. "request", "lesson"
  related_id uuid,
  status text not null default 'inviata' check (status in ('inviata','fallita','in_coda')),
  attempt_count int not null default 1,
  sent_at timestamptz not null default now()
);

-- ============================================================================
-- 17. REGISTRO ATTIVITÀ (audit)
-- ============================================================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,                                     -- es. "approva_richiesta", "modifica_prezzo", "correggi_credito"
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
comment on table activity_log is 'Traccia azioni sensibili: prezzi, pagamenti, assegnazioni, crediti, documenti, permessi (§22).';

-- ============================================================================
-- INDICI PRINCIPALI
-- ============================================================================

create index idx_requests_status on requests(status);
create index idx_requests_course on requests(course_id);
create index idx_lessons_date on lessons(lesson_date);
create index idx_lessons_slot on lessons(recurring_slot_id);
create index idx_bookings_athlete on bookings(athlete_id);
create index idx_credit_ledger_athlete on credit_ledger(athlete_id);
create index idx_waitlist_lesson on waitlist_entries(lesson_id, created_at);
create index idx_assignments_athlete on assignments(athlete_id);
create index idx_athletes_guardian on athletes(guardian_profile_id);
