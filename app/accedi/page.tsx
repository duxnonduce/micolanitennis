import { Suspense } from 'react';
import AccediForm from './accedi-form';

export default function AccediPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-16 text-center text-gray-400">Caricamento...</div>}>
      <AccediForm />
    </Suspense>
  );
}
