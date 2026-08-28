'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function callAction(action: 'approve' | 'reject' | 'request-info') {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
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
    <div className="card mt-6 space-y-3">
      <h2 className="font-semibold text-brand-blueDark">Azioni segreteria</h2>
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
          disabled={!!loading}
          onClick={() => callAction('approve')}
          className="btn-primary disabled:opacity-60"
        >
          {loading === 'approve' ? 'Approvazione...' : 'Approva'}
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
      <p className="text-xs text-gray-500">
        Nota: l&apos;approvazione qui conferma l&apos;iscrizione e attiva l&apos;Area riservata.
        L&apos;assegnazione di giorno/orario e la generazione del calendario lezioni sono
        parte della Fase 2, non ancora attiva in questo pacchetto.
      </p>
    </div>
  );
}
