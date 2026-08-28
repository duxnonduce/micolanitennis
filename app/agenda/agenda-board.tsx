'use client';

import { useState } from 'react';

type Booking = {
  id: string;
  status: string;
  source: string;
  athletes: { first_name: string; last_name: string };
};

type Lesson = {
  id: string;
  status: string;
  recurring_slots: {
    start_time: string;
    duration_minutes: number;
    courts: { name: string };
    groups: { name: string; courses: { name: string } };
  };
  bookings: Booking[];
};

const STATUS_CYCLE: Record<string, string> = {
  confermata: 'presente',
  presente: 'assente',
  assente: 'confermata',
};

const STATUS_STYLE: Record<string, string> = {
  confermata: 'bg-gray-100 text-gray-600',
  presente: 'bg-green-100 text-green-700',
  assente: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  confermata: 'Da segnare',
  presente: 'Presente',
  assente: 'Assente',
};

export default function AgendaBoard({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const [bookings, setBookings] = useState(lesson.bookings);
  const slot = lesson.recurring_slots;

  async function cycleStatus(booking: Booking) {
    const next = STATUS_CYCLE[booking.status] ?? 'presente';
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: next } : b)));
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      // rollback in caso di errore (es. permessi)
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: booking.status } : b)));
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-brand-blueDark">
            {slot.start_time.slice(0, 5)} · {slot.courts?.name}
          </p>
          <p className="text-sm text-gray-500">{slot.groups?.courses?.name} — {slot.groups?.name}</p>
        </div>
        <span className="text-xs text-gray-400">{slot.duration_minutes} min</span>
      </div>

      {bookings.length === 0 && <p className="mt-3 text-sm text-gray-400">Nessun atleta prenotato.</p>}

      <div className="mt-3 space-y-1">
        {bookings
          .filter((b) => b.status !== 'cancellata')
          .map((b) => (
            <button
              key={b.id}
              onClick={() => cycleStatus(b)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${STATUS_STYLE[b.status] ?? 'bg-gray-100'}`}
            >
              <span>{b.athletes.first_name} {b.athletes.last_name}</span>
              <span className="text-xs font-semibold">{STATUS_LABEL[b.status] ?? b.status}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
