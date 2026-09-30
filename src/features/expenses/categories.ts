// Stored as the id; the label is only UI copy
export const EXPENSE_CATEGORIES = [
  { id: 'groceries', label: 'Súper' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'rent', label: 'Alquiler' },
  { id: 'utilities', label: 'Servicios' },
  { id: 'transport', label: 'Transporte' },
  { id: 'going_out', label: 'Salidas' },
  { id: 'health', label: 'Salud' },
  { id: 'other', label: 'Otros' },
] as const

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id']

const labels = new Map<string, string>(EXPENSE_CATEGORIES.map((c) => [c.id, c.label]))

// Falls back to the raw id for categories this version doesn't know yet
export function getCategoryLabel(id: string) {
  return labels.get(id) ?? id
}
