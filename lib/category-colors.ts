export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  baby: { bg: '#fecdd3', border: '#fb7185', text: '#881337' },
  avviamento: { bg: '#bbf7d0', border: '#4ade80', text: '#14532d' },
  agonistico: { bg: '#e9d5ff', border: '#c084fc', text: '#581c87' },
  agonistico_pro: { bg: '#d8b4fe', border: '#a855f7', text: '#4c1d95' },
  adulti_avviamento: { bg: '#fed7aa', border: '#fb923c', text: '#7c2d12' },
  adulti_pro: { bg: '#fdba74', border: '#f97316', text: '#7c2d12' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  baby: 'Baby',
  avviamento: 'Avviamento',
  agonistico: 'Agonistico',
  agonistico_pro: 'Agonistico Pro',
  adulti_avviamento: 'Adulti Avv.',
  adulti_pro: 'Adulti Pro',
};

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: '#e5e7eb', border: '#9ca3af', text: '#374151' };
}
