export default function HomePage() {
  return (
    <div>
      <section className="bg-brand-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-accent">
            Scuola Tennis — Stagione 2026/2027
          </p>
          <h1 className="text-3xl font-extrabold md:text-5xl">Micolani Tennis</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Corsi per ogni età e livello, dai 3 anni all'agonismo. Scopri i nostri corsi
            e richiedi il tuo preventivo personalizzato in pochi minuti.
          </p>
          <a href="/preventivo" className="btn-primary mt-8 inline-block">
            Richiedi un preventivo
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-bold text-brand-blue">I nostri corsi</h2>
        <p className="mb-8 text-gray-600">
          Scegli il percorso più adatto: l'amministrazione assegnerà giorno e orario
          in base a livello, gruppi e disponibilità dopo la tua richiesta.
        </p>
        <a href="/corsi" className="btn-secondary">Vedi tutti i corsi</a>
      </section>
    </div>
  );
}
