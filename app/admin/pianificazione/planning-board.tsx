'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAY_NAMES_SHORT, formatTime } from '@/lib/planning-constants';

type Level = { id: string; name: string; numeric_value: number };
type Court = { id: string; name: string; is_covered: boolean; surface: string };
type Slot = { id: string; day_of_week: number; start_time: string; duration_minutes: number; court_id: string; default_coach_id: string | null; courts: { name: string } };
type Group = { id: string; name: string; max_capacity: number; level_id: string | null; recurring_slots: Slot[] };
type Course = { id: string; name: string; category: string };
type Coach = { id: string; full_name: string };

export default function PlanningBoard({
  courses,
  levels,
  courts,
  coaches,
  groupsByCourse,
}: {
  courses: Course[];
  levels: Level[];
  courts: Court[];
  coaches: Coach[];
  groupsByCourse: Record<string, Group[]>;
}) {
  const [openCourse, setOpenCourse] = useState<string | null>(courses[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div key={course.id} className="card">
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setOpenCourse(openCourse === course.id ? null : course.id)}
          >
            <span className="font-semibold text-brand-blueDark">{course.name}</span>
            <span className="text-sm text-gray-400">
              {(groupsByCourse[course.id] ?? []).length} gruppi {openCourse === course.id ? '▲' : '▼'}
            </span>
          </button>

          {openCourse === course.id && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {(groupsByCourse[course.id] ?? []).map((group) => (
                <GroupCard key={group.id} group={group} levels={levels} courts={courts} coaches={coaches} />
              ))}
              <NewGroupForm courseId={course.id} levels={levels} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GroupCard({ group, levels, courts, coaches }: { group: Group; levels: Level[]; courts: Court[]; coaches: Coach[] }) {
  const router = useRouter();
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const level = levels.find((l) => l.id === group.level_id);

  async function deleteGroup() {
    if (!confirm(`Eliminare il gruppo "${group.name}"? Solo se non ci sono atleti assegnati.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/groups/${group.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? 'Errore durante l\'eliminazione.');
      return;
    }
    router.refresh();
  }

  async function deleteSlot(slotId: string) {
    if (!confirm('Eliminare questo slot dal modello settimanale?')) return;
    const res = await fetch(`/api/admin/slots/${slotId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? 'Errore durante l\'eliminazione.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-xs text-gray-500">
            Capienza max {group.max_capacity}
            {level ? ` · ${level.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setShowSlotForm(!showSlotForm)} className="text-brand-blue font-medium">
            + Slot
          </button>
          <button onClick={deleteGroup} disabled={deleting} className="text-red-500">
            Elimina
          </button>
        </div>
      </div>

      {group.recurring_slots?.length > 0 && (
        <div className="mt-3 space-y-2">
          {group.recurring_slots.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs">
              <span className="font-medium">
                {DAY_NAMES_SHORT[s.day_of_week]} {formatTime(s.start_time)} · {s.courts?.name}
              </span>
              <CoachSelect slotId={s.id} coaches={coaches} currentCoachId={s.default_coach_id} />
              <button onClick={() => deleteSlot(s.id)} className="ml-auto text-gray-400 hover:text-red-500">
                ✕ elimina
              </button>
            </div>
          ))}
        </div>
      )}

      {showSlotForm && (
        <NewSlotForm groupId={group.id} courts={courts} onDone={() => setShowSlotForm(false)} />
      )}
    </div>
  );
}

function NewSlotForm({ groupId, courts, onDone }: { groupId: string; courts: Court[]; onDone: () => void }) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('17:00');
  const [duration, setDuration] = useState(60);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/groups/${groupId}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: dayOfWeek, start_time: startTime, duration_minutes: duration, court_id: courtId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Giorno</label>
          <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAY_NAMES_SHORT.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ora</label>
          <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="label">Durata (min)</label>
          <input type="number" className="input w-24" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Campo</label>
          <select className="input" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-60">
          {saving ? 'Salvo...' : 'Aggiungi'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CoachSelect({ slotId, coaches, currentCoachId }: { slotId: string; coaches: Coach[]; currentCoachId: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function updateCoach(coachId: string) {
    setSaving(true);
    await fetch(`/api/admin/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_coach_id: coachId || null }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      className="rounded border-gray-300 bg-white px-2 py-1 text-xs"
      defaultValue={currentCoachId ?? ''}
      disabled={saving}
      onChange={(e) => updateCoach(e.target.value)}
    >
      <option value="">Nessun maestro</option>
      {coaches.map((c) => (
        <option key={c.id} value={c.id}>{c.full_name}</option>
      ))}
    </select>
  );
}

function NewGroupForm({ courseId, levels }: { courseId: string; levels: Level[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [levelId, setLevelId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name) {
      setError('Dai un nome al gruppo.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, level_id: levelId || null, name, max_capacity: maxCapacity }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setName('');
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4">
      <p className="mb-2 text-sm font-medium text-gray-600">Nuovo gruppo</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label">Nome</label>
          <input className="input" placeholder='es. "Adulti Cat.2"' value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Capienza max</label>
          <input type="number" className="input w-24" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Livello (opz.)</label>
          <select className="input" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
            <option value="">—</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-60">
          {saving ? 'Creo...' : 'Crea gruppo'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
