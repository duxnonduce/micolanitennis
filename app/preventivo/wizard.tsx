'use client';

import { useMemo, useState } from 'react';
import { computeQuote, formatEuro, type Course, type PricePlan, type PriceInstallment } from '@/lib/pricing';

type CourseData = Course & {
  id: string;
  name: string;
  category: string;
  age_min: number | null;
  age_max: number | null;
  course_frequencies: { weekly_frequency: number }[];
  price_plans: (PricePlan & { price_installments: PriceInstallment[] })[];
};

const PASSWORD_HINT =
  'Almeno 8 caratteri, con una lettera maiuscola e un numero.';

function isPasswordValid(pw: string) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}

function calcAge(birthDate: string): number {
  const b = new Date(birthDate);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

export default function PreventivoWizard({
  courses,
  preselectedCourseId,
}: {
  courses: CourseData[];
  preselectedCourseId?: string;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ requestId: string } | null>(null);

  const [courseId, setCourseId] = useState(preselectedCourseId ?? '');
  const [weeklyFrequency, setWeeklyFrequency] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState('');
  const [chosenInstallments, setChosenInstallments] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [athlete, setAthlete] = useState({ firstName: '', lastName: '', birthDate: '', fiscalCode: '' });
  const [guardian, setGuardian] = useState({ firstName: '', lastName: '', phone: '' });
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [password, setPassword] = useState('');
  const [consents, setConsents] = useState({
    privacy: false,
    trattamento_dati: false,
    regolamento: false,
    uso_immagini: false,
  });

  const course = courses.find((c) => c.id === courseId);
  const availableFrequencies = (course?.course_frequencies ?? [])
    .map((f) => f.weekly_frequency)
    .sort((a, b) => a - b);
  const availableInstallmentCounts = useMemo(() => {
    if (!course || weeklyFrequency == null) return [];
    return course.price_plans
      .filter((p) => p.weekly_frequency === weeklyFrequency)
      .map((p) => p.num_installments)
      .sort((a, b) => a - b);
  }, [course, weeklyFrequency]);

  const quote = useMemo(() => {
    if (!course || weeklyFrequency == null || !entryDate || !chosenInstallments) return null;
    try {
      const installmentsByPlan: Record<string, PriceInstallment[]> = {};
      course.price_plans.forEach((p) => (installmentsByPlan[p.id] = p.price_installments));
      return computeQuote({
        course,
        plans: course.price_plans,
        installmentsByPlan,
        weeklyFrequency,
        chosenInstallments,
        entryDate,
      });
    } catch {
      return null;
    }
  }, [course, weeklyFrequency, entryDate, chosenInstallments]);

  const REGISTRATION_FEE = 100;

  function canGoStep2() {
    return !!courseId;
  }
  function canGoStep3() {
    return !!weeklyFrequency && !!entryDate && !!chosenInstallments;
  }
  function canGoStep4() {
    return true; // note è opzionale
  }
  function canSubmit() {
    if (isMinor === null) return false;
    if (!athlete.firstName || !athlete.lastName || !athlete.birthDate) return false;
    if (isMinor && (!guardian.firstName || !guardian.lastName)) return false;
    if (!accountEmail || !isPasswordValid(password)) return false;
    return consents.privacy && consents.trattamento_dati && consents.regolamento;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          weeklyFrequency,
          entryDate,
          chosenInstallments,
          notes,
          isMinor,
          athlete,
          guardian: isMinor ? guardian : null,
          accountEmail,
          accountPhone,
          password,
          consents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Errore durante l\'invio della richiesta.');
      setSubmitted({ requestId: data.requestId });
    } catch (err: any) {
      setSubmitError(err.message ?? 'Errore imprevisto. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-bold text-brand-blue">I dati inseriti sono ora in gestione</h2>
        <p className="mt-2 text-gray-600">
          Ti abbiamo inviato una email di conferma con il riepilogo del preventivo.
          La segreteria valuterà la tua richiesta a breve.
        </p>
        <a href="/area-riservata" className="btn-primary mt-6 inline-block">
          Accedi all'Area riservata
        </a>
      </div>
    );
  }

  return (
    <div>
      <Steps current={step} />

      {step === 1 && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-brand-blueDark">1. Scegli il corso</h2>
          <div className="space-y-2">
            {courses.map((c) => (
              <label
                key={c.id}
                className={`block cursor-pointer rounded-lg border p-4 ${
                  courseId === c.id ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="course"
                  className="mr-2"
                  checked={courseId === c.id}
                  onChange={() => {
                    setCourseId(c.id);
                    setWeeklyFrequency(null);
                    setChosenInstallments(null);
                  }}
                />
                <span className="font-medium">{c.name}</span>
                {c.age_min && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({c.age_min}{c.age_max ? `-${c.age_max}` : '+'} anni)
                  </span>
                )}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button disabled={!canGoStep2()} className="btn-primary disabled:opacity-40" onClick={() => setStep(2)}>
              Continua
            </button>
          </div>
        </div>
      )}

      {step === 2 && course && (
        <div className="card mt-6 space-y-5">
          <h2 className="font-semibold text-brand-blueDark">2. Frequenza e data di ingresso</h2>

          <div>
            <label className="label">Quante volte a settimana?</label>
            <div className="flex flex-wrap gap-2">
              {availableFrequencies.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setWeeklyFrequency(f);
                    setChosenInstallments(null);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    weeklyFrequency === f
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="entryDate">Quando vuoi iniziare?</label>
            <input
              id="entryDate"
              type="date"
              className="input"
              min={course.start_date}
              max={course.end_date}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          {weeklyFrequency != null && (
            <div>
              <label className="label">In quante rate vuoi pagare?</label>
              <div className="flex flex-wrap gap-2">
                {availableInstallmentCounts.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setChosenInstallments(n)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      chosenInstallments === n
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {n === 1 ? 'Unica' : `${n} rate`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(1)}>Indietro</button>
            <button disabled={!canGoStep3()} className="btn-primary disabled:opacity-40" onClick={() => setStep(3)}>
              Continua
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-brand-blueDark">3. Note o preferenze</h2>
          <textarea
            className="input"
            rows={4}
            placeholder="Es. preferenze di giorni/orari, esigenze particolari..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Le preferenze indicate saranno valutate dall'amministrazione in base alla
            disponibilità dei posti e non costituiscono un'assegnazione definitiva.
          </p>
          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>Indietro</button>
            <button className="btn-primary" onClick={() => setStep(4)}>Continua</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card mt-6 space-y-5">
          <h2 className="font-semibold text-brand-blueDark">4. Anagrafica e accesso</h2>

          <div>
            <label className="label">Per chi è l'iscrizione?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMinor(false)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  isMinor === false ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                }`}
              >
                Per me stesso (adulto)
              </button>
              <button
                type="button"
                onClick={() => setIsMinor(true)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  isMinor === true ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                }`}
              >
                Per mio figlio/a (minorenne)
              </button>
            </div>
          </div>

          {isMinor !== null && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome atleta</label>
                  <input className="input" value={athlete.firstName} onChange={(e) => setAthlete({ ...athlete, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Cognome atleta</label>
                  <input className="input" value={athlete.lastName} onChange={(e) => setAthlete({ ...athlete, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data di nascita</label>
                  <input type="date" className="input" value={athlete.birthDate} onChange={(e) => setAthlete({ ...athlete, birthDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Codice fiscale</label>
                  <input className="input" value={athlete.fiscalCode} onChange={(e) => setAthlete({ ...athlete, fiscalCode: e.target.value })} />
                </div>
              </div>

              {isMinor && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-3 text-sm font-medium text-gray-700">Dati del genitore/tutore</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nome</label>
                      <input className="input" value={guardian.firstName} onChange={(e) => setGuardian({ ...guardian, firstName: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Cognome</label>
                      <input className="input" value={guardian.lastName} onChange={(e) => setGuardian({ ...guardian, lastName: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email {isMinor ? '(del genitore)' : ''}</label>
                  <input type="email" className="input" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input className="input" value={accountPhone} onChange={(e) => setAccountPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Crea una password</label>
                <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="mt-1 text-xs text-gray-500">{PASSWORD_HINT}</p>
              </div>

              <div className="space-y-2 border-t pt-4">
                <ConsentCheckbox
                  label="Accetto l'informativa privacy"
                  checked={consents.privacy}
                  onChange={(v) => setConsents({ ...consents, privacy: v })}
                />
                <ConsentCheckbox
                  label="Acconsento al trattamento dei dati"
                  checked={consents.trattamento_dati}
                  onChange={(v) => setConsents({ ...consents, trattamento_dati: v })}
                />
                <ConsentCheckbox
                  label="Accetto il regolamento della scuola"
                  checked={consents.regolamento}
                  onChange={(v) => setConsents({ ...consents, regolamento: v })}
                />
                <ConsentCheckbox
                  label="Acconsento all'uso delle immagini (facoltativo)"
                  checked={consents.uso_immagini}
                  onChange={(v) => setConsents({ ...consents, uso_immagini: v })}
                />
              </div>
            </>
          )}

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(3)}>Indietro</button>
            <button disabled={!canSubmit()} className="btn-primary disabled:opacity-40" onClick={() => setStep(5)}>
              Continua
            </button>
          </div>
        </div>
      )}

      {step === 5 && course && quote && (
        <div className="card mt-6 space-y-4">
          <h2 className="font-semibold text-brand-blueDark">5. Riepilogo e invio</h2>

          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <p><strong>Corso:</strong> {course.name}</p>
            <p><strong>Frequenza:</strong> {weeklyFrequency}x a settimana</p>
            <p><strong>Ingresso:</strong> {new Date(entryDate).toLocaleDateString('it-IT')}</p>
            <p><strong>Atleta:</strong> {athlete.firstName} {athlete.lastName}</p>
            {quote.isLateEntry && (
              <p className="mt-2 text-brand-blueDark">
                Ingresso a stagione iniziata: importo riproporzionato sul periodo residuo.
              </p>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Rata</th>
                <th className="py-2">Importo</th>
                <th className="py-2">Scadenza</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Quota d'iscrizione</td>
                <td className="py-2">{formatEuro(REGISTRATION_FEE)}</td>
                <td className="py-2">Con la 1ª rata</td>
              </tr>
              {quote.installments.map((i) => (
                <tr key={i.index} className="border-b last:border-0">
                  <td className="py-2">Rata {i.index}</td>
                  <td className="py-2">{formatEuro(i.amount)}</td>
                  <td className="py-2">{i.dueDate ? new Date(i.dueDate).toLocaleDateString('it-IT') : 'da definire'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-right text-lg font-bold text-brand-blue">
            Totale: {formatEuro(quote.totalAmount + REGISTRATION_FEE)}
          </p>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(4)}>Indietro</button>
            <button disabled={submitting} className="btn-primary disabled:opacity-60" onClick={handleSubmit}>
              {submitting ? 'Invio in corso...' : 'Invia richiesta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ current }: { current: number }) {
  const labels = ['Corso', 'Frequenza', 'Note', 'Anagrafica', 'Riepilogo'];
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              current === i + 1 ? 'bg-brand-blue text-white' : current > i + 1 ? 'bg-brand-accent text-brand-blueDark' : 'bg-gray-200'
            }`}
          >
            {i + 1}
          </span>
          <span className="hidden sm:inline">{l}</span>
          {i < labels.length - 1 && <span className="mx-1 text-gray-300">—</span>}
        </div>
      ))}
    </div>
  );
}

function ConsentCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
