'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

type CandidateSlot = {
  id: string;
  groupName: string;
  groupId: string;
  levelName: string | null;
  maxCapacity: number;
  occupied: number;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  courtName: string;
};

export default function RequestActions({
  requestId,
  currentStatus,
  weeklyFrequency,
  candidateSlots,
  athleteLevelId,
}: {
  requestId: string;
  currentStatus: string;
  weeklyFrequency: number;
  candidateSlots: CandidateSlot[];
  athleteLevelId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const sortedSlots = useMemo(
    () => [...candidateSlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [candidateSlots]
  );

  function toggleSlot(id: string) {
    setSelectedSlots((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= weeklyFrequency) return prev; // rispetta la frequenza scelta dall'utente
      return [...prev, id];
    });
  }

  async function callAction(action: 'approve' | 'reject' | 'request-info') {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, slotIds: selectedSlots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Errore.');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  if (['approvata', 'rifiutata', 'annullata'].includes(currentStatus)) {
    return (
      <p className="mt-6 text-sm text-gray-500">
        Questa richiesta è già stata gestita (stato: {currentStatus.replace('_', ' ')}).
      </p>
    );
  }

  return (
    <div className="card mt-6 space-y-5">
      <div>
        <h2 className="font-semibold text-brand-blueDark">
          Assegna {weeklyFrequency} slot{weeklyFrequency > 1 ? 's' : ''} settimanal{weeklyFrequency > 1 ? 'i' : 'e'}
        </h2>
        <p className="text-xs text-gray-500">
          Seleziona {weeklyFrequency === 1 ? 'lo slot' : `i ${weeklyFrequency} slot`} in cui inserire l'atleta.
          Necessario per approvare.
        </p>

        {sortedSlots.length === 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Nessuno slot ancora creato per questo corso. Vai su{' '}
            <a href="/admin/pianificazione" className="underline">Pianificazione</a> per crearne.
          </p>
        )}

        <div className="mt-3 space-y-2">
          {sortedSlots.map((s) => {
            const full = s.occupied >= s.maxCapacity;
            const selected = selectedSlots.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm ${
                  selected ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
                } ${full && !selected ? 'opacity-50' : ''}`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={full && !selected}
                    onChange={() => toggleSlot(s.id)}
                  />
                  <span>
                    <strong>{DAY_NAMES_SHORT[s.dayOfWeek]} {s.startTime.slice(0, 5)}</strong>
                    {' · '}{s.courtName} · {s.groupName}
                    {s.levelName ? ` · ${s.levelName}` : ''}
                  </span>
                </span>
                <span className={`text-xs ${full ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {s.occupied}/{s.maxCapacity} {full ? '(pieno)' : ''}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <textarea
        className="input"
        rows={2}
        placeholder="Nota interna o messaggio per l'utente (facoltativo)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={!!loading || selectedSlots.length !== weeklyFrequency}
          onClick={() => callAction('approve')}
          className="btn-primary disabled:opacity-40"
        >
          {loading === 'approve' ? 'Approvazione...' : `Approva (${selectedSlots.length}/${weeklyFrequency} slot selezionati)`}
        </button>
        <button
          disabled={!!loading}
          onClick={() => callAction('request-info')}
          className="btn-secondary disabled:opacity-60"
        >
          {loading === 'request-info' ? 'Invio...' : 'Richiedi integrazione'}
        </button>
        <button
          disabled={!!loading}
          onClick={() => callAction('reject')}
          className="rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {loading === 'reject' ? 'Rifiuto...' : 'Rifiuta'}
        </button>
      </div>
    </div>
  );
}
