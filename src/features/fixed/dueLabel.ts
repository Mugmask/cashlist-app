import type { FixedLine } from './overview'

export type DueTone = 'muted' | 'warning' | 'danger'

// Days ahead from which a due date is close enough to warn about
export const DUE_SOON_DAYS = 3

// UI copy for when a fixed expense still to pay is due, and its tone: gone by is danger,
// within DUE_SOON_DAYS a warning
export function dueLabel(due: NonNullable<FixedLine['due']>): { text: string; tone: DueTone } {
  const { day, daysLeft } = due
  if (daysLeft < -1) return { text: `Venció el ${day}`, tone: 'danger' }
  if (daysLeft === -1) return { text: 'Venció ayer', tone: 'danger' }
  if (daysLeft === 0) return { text: 'Vence hoy', tone: 'warning' }
  if (daysLeft === 1) return { text: 'Vence mañana', tone: 'warning' }
  if (daysLeft <= DUE_SOON_DAYS) return { text: `Vence en ${daysLeft} días`, tone: 'warning' }
  return { text: `Vence el ${day}`, tone: 'muted' }
}

// The ones still to pay that are overdue or due soon, most urgent first (`pending` already is)
export function urgentLines(pending: readonly FixedLine[]) {
  return pending.filter((l) => l.due !== undefined && l.due.daysLeft <= DUE_SOON_DAYS)
}
