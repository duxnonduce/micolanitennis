import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Micolani Tennis — Iscrizioni Stagione 2026/2027',
  description: 'Scuola tennis Micolani — Cavallino (LE). Richiedi il tuo preventivo e iscriviti online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="sticky top-0 z-40 border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-extrabold text-brand-blue">
              MICOLANI <span className="font-normal text-gray-500">TENNIS</span>
            </a>
            <nav className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
              <a href="/corsi" className="hover:text-brand-blue">Corsi</a>
              <a href="/area-riservata" className="hover:text-brand-blue">Area riservata</a>
              <a href="/accedi?next=/admin/richieste" className="hover:text-brand-blue">Admin</a>
            </nav>
            <a href="/preventivo" className="btn-primary !px-4 !py-2 text-sm">
              Richiedi un preventivo
            </a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t bg-white py-8 text-center text-sm text-gray-500">
          Micolani Tennis — Via Vecchia San Donato ang. Via Pepini, Cavallino (LE) — +39 351 816 7085
        </footer>
      </body>
    </html>
  );
}
