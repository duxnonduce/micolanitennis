'use client';

import { useState } from 'react';

export default function CreaAccountStaffPage() {
  const [secret, setSecret] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('secretary');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, email, password, fullName, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Errore.');
      setResult(`Account creato con ruolo "${data.role}". Ora puoi accedere da /accedi con questa email e password.`);
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold text-brand-blue">Crea account staff</h1>
      <p className="mb-6 text-sm text-gray-500">
        Questa pagina non è collegata al questionario iscrizioni. Serve per creare account
        di segreteria/amministrazione, protetti da un codice di sicurezza noto solo a te.
      </p>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Codice di sicurezza</label>
          <input type="password" className="input" value={secret} onChange={(e) => setSecret(e.target.value)} required />
        </div>
        <div>
          <label className="label">Nome e cognome</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="label">Ruolo</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="secretary">Segreteria</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
            <option value="coach">Maestro</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && <p className="text-sm text-green-700">{result}</p>}
        <button disabled={loading} className="btn-primary w-full disabled:opacity-60" type="submit">
          {loading ? 'Creazione...' : 'Crea account'}
        </button>
      </form>
    </div>
  );
}
