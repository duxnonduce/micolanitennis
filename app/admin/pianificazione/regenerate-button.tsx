'use client';

import { useState } from 'react';

export default function RegenerateButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/regenerate-calendar', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Errore.');
      setResult(
        `Fatto: ${data.slotsProcessed} slot elaborati, ${data.totalLessons} date lezione verificate, ${data.totalBookings} nuove prenotazioni create.` +
          (data.errors?.length ? ` Attenzione: ${data.errors.length} errori (vedi console).` : '')
      );
      if (data.errors?.length) console.error(data.errors);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-brand-blueDark">Calendario lezioni</p>
          <p className="text-sm text-gray-500">
            Genera le lezioni reali dagli slot e le prenotazioni per gli atleti già assegnati.
            Sicura da rilanciare quante volte vuoi: non tocca lezioni o presenze già modificate a mano.
          </p>
        </div>
        <button onClick={run} disabled={loading} className="btn-secondary whitespace-nowrap disabled:opacity-60">
          {loading ? 'Generazione...' : 'Rigenera calendario'}
        </button>
      </div>
      {result && <p className="mt-3 text-sm text-green-700">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
