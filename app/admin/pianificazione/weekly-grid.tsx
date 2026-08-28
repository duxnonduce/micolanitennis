'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAY_NAMES } from '@/lib/planning-constants';
import { getCategoryColor, CATEGORY_LABELS } from '@/lib/category-colors';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunedì -> Domenica
const ROW_HEIGHT = 30; // px per mezz'ora
const DEFAULT_START_MIN = 8 * 60; // 08:00 se non ci sono ancora slot
const DEFAULT_END_MIN = 21 * 60; // 21:00

type Court = { id: string; name: string };
type Slot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  courtId: string;
  courtName: string;
  groupId: string;
  groupName: string;
  maxCapacity: number;
  courseId: string;
  courseName: string;
  courseCategory: string;
  defaultCoachId: string | null;
  athleteNames: string[];
};
type Coach = { id: string; full_name: string };
type Group = { id: string; name: string; max_capacity: number };

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(m: number) {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
}

export default function WeeklyGrid({
  courts,
  slots,
  groupsByCourse,
  coaches,
  courses,
}: {
  courts: Court[];
  slots: Slot[];
  groupsByCourse: Record<string, Group[]>;
  coaches: Coach[];
  courses: { id: string; name: string }[];
}) {
  const todayDow = new Date().getDay();
  const [activeDay, setActiveDay] = useState(todayDow);
  const [addTarget, setAddTarget] = useState<{ courtId: string; startTime: string } | null>(null);
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const router = useRouter();

  const { gridStart, gridEnd, rows } = useMemo(() => {
    if (slots.length === 0) {
      return { gridStart: DEFAULT_START_MIN, gridEnd: DEFAULT_END_MIN, rows: (DEFAULT_END_MIN - DEFAULT_START_MIN) / 30 };
    }
    let min = Math.min(...slots.map((s) => toMinutes(s.startTime)));
    let max = Math.max(...slots.map((s) => toMinutes(s.startTime) + s.durationMinutes));
    min = Math.floor(min / 60) * 60;
    max = Math.ceil(max / 60) * 60;
    min = Math.min(min, DEFAULT_START_MIN);
    max = Math.max(max, DEFAULT_END_MIN);
    return { gridStart: min, gridEnd: max, rows: (max - min) / 30 };
  }, [slots]);

  const daySlots = slots.filter((s) => s.dayOfWeek === activeDay);
  const totalHeight = rows * ROW_HEIGHT;

  return (
    <div>
      {/* Tab giorni */}
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {DAY_ORDER.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold ${
              activeDay === d ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {DAY_NAMES[d]}
          </button>
        ))}
      </div>

      {/* Legenda colori */}
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const c = getCategoryColor(cat);
          return (
            <span key={cat} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }} />
              {label}
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="flex min-w-[900px]">
          {/* Colonna orari */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200">
            <div className="h-10 border-b border-gray-200" />
            <div className="relative" style={{ height: totalHeight }}>
              {Array.from({ length: rows }).map((_, i) => {
                const minutes = gridStart + i * 30;
                const isHour = minutes % 60 === 0;
                return (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-gray-100 pl-1 text-[10px] text-gray-400"
                    style={{ top: i * ROW_HEIGHT }}
                  >
                    {isHour ? fromMinutes(minutes) : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Colonne campi */}
          {courts.map((court) => (
            <div key={court.id} className="flex-1 border-r border-gray-200 last:border-r-0" style={{ minWidth: 130 }}>
              <div className="flex h-10 items-center justify-center border-b border-gray-200 text-xs font-bold text-brand-blueDark">
                {court.name}
              </div>
              <div className="relative" style={{ height: totalHeight }}>
                {/* celle vuote cliccabili */}
                {Array.from({ length: rows }).map((_, i) => (
                  <button
                    key={i}
                    className="absolute inset-x-0 border-t border-gray-100 hover:bg-brand-blue/5"
                    style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    onClick={() => setAddTarget({ courtId: court.id, startTime: fromMinutes(gridStart + i * 30) })}
                  />
                ))}

                {/* blocchi gruppo */}
                {daySlots
                  .filter((s) => s.courtId === court.id)
                  .map((s) => {
                    const top = (toMinutes(s.startTime) - gridStart) * (ROW_HEIGHT / 30);
                    const height = s.durationMinutes * (ROW_HEIGHT / 30);
                    const color = getCategoryColor(s.courseCategory);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setOpenSlot(s)}
                        className="absolute inset-x-0.5 overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm"
                        style={{ top, height, backgroundColor: color.bg, borderColor: color.border, color: color.text }}
                      >
                        <div className="font-bold">{s.groupName}</div>
                        {s.athleteNames.length > 0 ? (
                          <div className="truncate">{s.athleteNames.join(', ')}</div>
                        ) : (
                          <div className="opacity-60">0/{s.maxCapacity}</div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {addTarget && (
        <AddSlotPanel
          target={addTarget}
          dayOfWeek={activeDay}
          groupsByCourse={groupsByCourse}
          courses={courses}
          onClose={() => setAddTarget(null)}
          onDone={() => {
            setAddTarget(null);
            router.refresh();
          }}
        />
      )}

      {openSlot && (
        <SlotDetailPanel
          slot={openSlot}
          coaches={coaches}
          onClose={() => setOpenSlot(null)}
          onDone={() => {
            setOpenSlot(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddSlotPanel({
  target,
  dayOfWeek,
  groupsByCourse,
  courses,
  onClose,
  onDone,
}: {
  target: { courtId: string; startTime: string };
  dayOfWeek: number;
  groupsByCourse: Record<string, Group[]>;
  courses: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const courseIds = Object.keys(groupsByCourse);
  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? id;
  const [courseId, setCourseId] = useState(courseIds[0] ?? '');
  const [groupId, setGroupId] = useState(groupsByCourse[courseIds[0]]?.[0]?.id ?? '');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState(target.startTime);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = groupsByCourse[courseId] ?? [];

  async function save() {
    if (!groupId) {
      setError('Scegli un gruppo.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/groups/${groupId}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: dayOfWeek,
        start_time: startTime,
        duration_minutes: duration,
        court_id: target.courtId,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-xl bg-white p-5 sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-semibold text-brand-blueDark">Posiziona un gruppo</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Corso</label>
            <select
              className="input"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setGroupId(groupsByCourse[e.target.value]?.[0]?.id ?? '');
              }}
            >
              {courseIds.length === 0 && <option value="">Nessun corso con gruppi creati</option>}
              {courseIds.map((cid) => (
                <option key={cid} value={cid}>{courseName(cid)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Se non vedi il corso giusto, crealo prima da "Gestisci gruppi" qui sotto.
            </p>
          </div>
          <div>
            <label className="label">Gruppo</label>
            <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.length === 0 && <option value="">Nessun gruppo per questo corso</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} (max {g.max_capacity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Ora inizio</label>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Durata (min)</label>
              <input type="number" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary !px-4 !py-2 text-sm">Annulla</button>
            <button onClick={save} disabled={saving || !groupId} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50">
              {saving ? 'Salvo...' : 'Posiziona'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotDetailPanel({
  slot,
  coaches,
  onClose,
  onDone,
}: {
  slot: Slot;
  coaches: Coach[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [coachId, setCoachId] = useState(slot.defaultCoachId ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCoach() {
    setSaving(true);
    await fetch(`/api/admin/slots/${slot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_coach_id: coachId || null }),
    });
    setSaving(false);
    onDone();
  }

  async function deleteSlot() {
    if (!confirm('Rimuovere questo gruppo da questa cella della griglia?')) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/slots/${slot.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-xl bg-white p-5 sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-brand-blueDark">{slot.groupName}</h3>
        <p className="text-sm text-gray-500">
          {slot.courseName} · {slot.courtName} · {slot.startTime.slice(0, 5)} ({slot.durationMinutes} min)
        </p>

        <div className="mt-3">
          <p className="mb-1 text-sm font-medium text-gray-600">
            Atleti assegnati ({slot.athleteNames.length}/{slot.maxCapacity})
          </p>
          {slot.athleteNames.length > 0 ? (
            <ul className="text-sm text-gray-700">
              {slot.athleteNames.map((n, i) => <li key={i}>· {n}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Ancora nessun atleta assegnato.</p>
          )}
        </div>

        <div className="mt-4">
          <label className="label">Maestro</label>
          <div className="flex gap-2">
            <select className="input" value={coachId} onChange={(e) => setCoachId(e.target.value)}>
              <option value="">Nessun maestro</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <button onClick={saveCoach} disabled={saving} className="btn-secondary !px-3 !py-2 text-sm whitespace-nowrap disabled:opacity-60">
              {saving ? '...' : 'Salva'}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-between">
          <button onClick={onClose} className="btn-secondary !px-4 !py-2 text-sm">Chiudi</button>
          <button
            onClick={deleteSlot}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? 'Rimuovo...' : 'Rimuovi dalla griglia'}
          </button>
        </div>
      </div>
    </div>
  );
}
