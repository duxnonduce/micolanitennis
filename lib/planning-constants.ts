export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export function formatTime(t: string) {
  // t arriva come "19:00:00" da Postgres time
  return t.slice(0, 5);
}

/**
 * Conta gli atleti attualmente assegnati a uno slot ricorrente (assignment attivo, active_to nullo o futuro).
 */
export function countOccupancy(assignments: { active_to: string | null }[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return assignments.filter((a) => !a.active_to || a.active_to >= today).length;
}
