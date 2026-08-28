# Micolani Tennis — Gestionale (Fase 1)

Sito pubblico + questionario preventivo/iscrizione + coda admin + Area riservata
in stato "in attesa". Next.js 14 (App Router) + Supabase + Resend, pronto per
Vercel.

## Cosa c'è in questo pacchetto

- **Sito pubblico**: home, elenco corsi, dettaglio corso con listino
- **Questionario "Richiedi un preventivo"**: wizard a 5 step (corso → frequenza/ingresso → note → anagrafica/consensi → riepilogo/invio), calcolo prezzo lato server (incluso riproporzionamento ingresso tardivo)
- **Area riservata**: stato richiesta, piano rate
- **Coda admin**: lista richieste con filtro per stato, dettaglio, azioni (approva / richiedi integrazione / rifiuta)
- **Email transazionali** via Resend: richiesta ricevuta, approvata, rifiutata
- **Schema dati completo** + seed con i 6 corsi reali e tutti i listini dalle brochure + policy di sicurezza (RLS)

## Cosa NON c'è ancora (Fase 2, come da piano concordato)

- Planning generale settimanale, gruppi, assegnazione giorno/orario
- Generazione calendario lezioni ricorrenti
- Cancellazioni, crediti/gettoni, lista d'attesa, area maestri
- Riconciliazione pagamenti "vera" (per ora solo conferma manuale segreteria)

L'approvazione di una richiesta oggi conferma l'iscrizione via email ma **non**
genera ancora calendario/orari — quella parte arriva con la Fase 2.

---

## Setup — passo per passo

### 1. Supabase

1. Crea un nuovo progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui, **in quest'ordine**, i 3 file nella cartella `supabase/`:
   - `01_schema.sql` — crea tutte le tabelle
   - `02_seed.sql` — inserisce i 6 corsi reali con tutti i listini. **Attenzione**: le scadenze delle rate a 1/2/5 installment sono placeholder spaziati sulla stagione — solo le 3 date del piano a 3 rate sono quelle ufficiali (20/09, 20/12, 21/03). Verificale e correggile dalla tabella `price_installments` prima di aprire le iscrizioni. Anche `early_bird_deadline` è lasciato vuoto: valorizzalo tu quando decidi entro quando restano validi i piani agevolati.
   - `03_rls.sql` — attiva le policy di sicurezza per ruolo
3. Vai su **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (sezione "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **tienila segreta, mai nel client**

### 2. Resend (email)

1. Su [resend.com](https://resend.com), verifica il dominio `micolanitennis.com` (o un dominio ponte tuo, come discusso — riparliamone quando è il momento di spostarlo)
2. Copia la API key → `RESEND_API_KEY`
3. Imposta `RESEND_FROM_EMAIL` con un indirizzo del dominio verificato (es. `iscrizioni@micolanitennis.com`)

### 3. Variabili d'ambiente

Copia `.env.example` in `.env.local` per lo sviluppo, e imposta le stesse
variabili su **Vercel → Project Settings → Environment Variables** per la
produzione. Aggiungi anche `NEXT_PUBLIC_SITE_URL` con l'URL pubblico finale
del sito (serve per i link nelle email).

### 4. Deploy

1. Crea un nuovo repository su GitHub e carica questa cartella (drag-and-drop
   dei file va benissimo, come già fatto per gli altri progetti)
2. Su [vercel.com](https://vercel.com), importa il repository
3. Aggiungi le environment variables (punto 3)
4. Deploy

### 5. Primo utente segreteria/admin

Il questionario pubblico crea solo utenti con ruolo `athlete`/`parent`. Per
creare il primo utente segreteria:

1. Registra un account qualsiasi tramite `/preventivo` (anche fittizio)
2. Su Supabase → **Table Editor → profiles**, trova la riga con quell'email
   e cambia `role` in `secretary` o `admin`
3. Da quel momento quell'account può accedere a `/admin/richieste`

---

## Test consigliati prima di aprire le iscrizioni

- Invia una richiesta di preventivo per ciascuno dei 6 corsi, con almeno una
  combinazione di rate diversa per corso — controlla che gli importi in email
  e nel riepilogo coincidano con le brochure
- Prova una data di ingresso **dopo** il 14 settembre 2026 per verificare il
  riproporzionamento
- Verifica ricezione email (controlla anche spam la prima volta)
- Accedi come segreteria, apri una richiesta, prova approva / richiedi
  integrazione / rifiuta e controlla che lo stato cambi anche lato Area riservata
- Prova da smartphone: il wizard e la coda admin sono pensati mobile-first
  ma vale la pena controllarli sul tuo telefono reale

Fammi sapere come va appena hai un attimo per testarlo.
