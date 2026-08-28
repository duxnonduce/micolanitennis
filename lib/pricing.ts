// ============================================================================
// Motore di calcolo prezzi — corso + frequenza + rate + data di ingresso
// Implementa capitolato §7 (regole economiche) con le decisioni prese con Mattia:
//   - riproporzionamento = prezzo_ordinario × (settimane_residue / settimane_totali)
//   - il prezzo ordinario è sempre il piano con il totale più alto (di norma il piano a più rate)
// ============================================================================

export type PricePlan = {
  id: string;
  course_id: string;
  weekly_frequency: number;
  num_installments: number;
  total_amount: number;
  early_bird_deadline: string | null; // ISO date
  is_ordinary_price: boolean;
};

export type PriceInstallment = {
  id: string;
  price_plan_id: string;
  installment_index: number;
  amount: number;
  due_date: string | null; // ISO date
};

export type Course = {
  id: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
};

export type QuoteInstallment = {
  index: number;
  amount: number;
  dueDate: string | null;
};

export type Quote = {
  totalAmount: number;
  isLateEntry: boolean;
  usedOrdinaryPrice: boolean;
  installments: QuoteInstallment[];
};

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

function weeksBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return Math.max(0, (to - from) / MS_PER_WEEK);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Distribuisce un totale su N rate in modo uniforme, correggendo eventuali
 * centesimi di arrotondamento sull'ultima rata così che la somma torni esatta.
 * Le date vengono ereditate dal piano ordinario quando disponibili; altrimenti
 * restano null e vanno fissate manualmente dalla segreteria in approvazione (§7.4).
 */
function distributeEvenly(
  total: number,
  numInstallments: number,
  referenceDueDates: (string | null)[]
): QuoteInstallment[] {
  const base = Math.floor((total / numInstallments) * 100) / 100;
  const installments: QuoteInstallment[] = [];
  let allocated = 0;

  for (let i = 1; i <= numInstallments; i++) {
    const isLast = i === numInstallments;
    const amount = isLast ? round2(total - allocated) : base;
    allocated = round2(allocated + amount);
    installments.push({
      index: i,
      amount,
      dueDate: referenceDueDates[i - 1] ?? null,
    });
  }
  return installments;
}

/**
 * Calcola il preventivo per una richiesta.
 *
 * @param course corso selezionato (con date proprie)
 * @param plans tutti i price_plans disponibili per corso+frequenza
 * @param installmentsByPlan mappa plan_id -> rate del piano (per importi/scadenze standard)
 * @param weeklyFrequency frequenza scelta
 * @param chosenInstallments numero di rate scelto dall'utente
 * @param entryDate data di ingresso scelta ("Quando vuoi iniziare?")
 * @param today data corrente, usata per verificare la scadenza early-bird
 */
export function computeQuote(params: {
  course: Course;
  plans: PricePlan[];
  installmentsByPlan: Record<string, PriceInstallment[]>;
  weeklyFrequency: number;
  chosenInstallments: number;
  entryDate: string;
  today?: string;
}): Quote {
  const {
    course,
    plans,
    installmentsByPlan,
    weeklyFrequency,
    chosenInstallments,
    entryDate,
  } = params;
  const today = params.today ?? new Date().toISOString().slice(0, 10);

  const freqPlans = plans.filter((p) => p.weekly_frequency === weeklyFrequency);
  const ordinaryPlan = freqPlans.find((p) => p.is_ordinary_price);
  if (!ordinaryPlan) {
    throw new Error('Nessun piano "prezzo ordinario" configurato per questa frequenza.');
  }

  const isLateEntry = entryDate > course.start_date;

  // --- Caso 1: ingresso a stagione iniziata → riproporzionamento sul prezzo ordinario ---
  if (isLateEntry) {
    const totalWeeks = weeksBetween(course.start_date, course.end_date);
    const remainingWeeks = weeksBetween(entryDate, course.end_date);
    const ratio = totalWeeks > 0 ? remainingWeeks / totalWeeks : 0;
    const proratedTotal = round2(ordinaryPlan.total_amount * ratio);

    // Le scadenze standard del piano ordinario fanno da riferimento; la segreteria
    // le correggerà in approvazione secondo la regola "scadute → pagabili entro 7 giorni".
    const ordinaryInstallments = (installmentsByPlan[ordinaryPlan.id] ?? [])
      .sort((a, b) => a.installment_index - b.installment_index)
      .map((i) => i.due_date);

    return {
      totalAmount: proratedTotal,
      isLateEntry: true,
      usedOrdinaryPrice: true,
      installments: distributeEvenly(proratedTotal, chosenInstallments, ordinaryInstallments),
    };
  }

  // --- Caso 2: ingresso puntuale → cerca il piano esatto per le rate scelte ---
  const chosenPlan = freqPlans.find((p) => p.num_installments === chosenInstallments);
  if (!chosenPlan) {
    throw new Error('Nessun piano configurato per il numero di rate richiesto.');
  }

  const withinEarlyBird =
    !chosenPlan.early_bird_deadline || today <= chosenPlan.early_bird_deadline;

  // Il piano scelto è ancora agevolato (o è già il piano ordinario, sempre valido)
  if (chosenPlan.is_ordinary_price || withinEarlyBird) {
    const rows = (installmentsByPlan[chosenPlan.id] ?? []).sort(
      (a, b) => a.installment_index - b.installment_index
    );
    return {
      totalAmount: chosenPlan.total_amount,
      isLateEntry: false,
      usedOrdinaryPrice: chosenPlan.is_ordinary_price,
      installments: rows.map((r) => ({
        index: r.installment_index,
        amount: r.amount,
        dueDate: r.due_date,
      })),
    };
  }

  // Il piano agevolato scelto non è più valido: si passa al prezzo ordinario,
  // distribuito comunque sul numero di rate che l'utente aveva scelto.
  const ordinaryInstallments = (installmentsByPlan[ordinaryPlan.id] ?? [])
    .sort((a, b) => a.installment_index - b.installment_index)
    .map((i) => i.due_date);

  return {
    totalAmount: ordinaryPlan.total_amount,
    isLateEntry: false,
    usedOrdinaryPrice: true,
    installments: distributeEvenly(
      ordinaryPlan.total_amount,
      chosenInstallments,
      ordinaryInstallments
    ),
  };
}

export function formatEuro(amount: number): string {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}
