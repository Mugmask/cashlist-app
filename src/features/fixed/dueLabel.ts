import { formatShortDay } from '@/utils/dates'
import type { FixedLine } from './overview'

// UI copy for where a fixed expense stands this month, and its tone
export function dueLabel(line: FixedLine): { text: string; tone: 'muted' | 'warning' | 'danger' } {
  switch (line.status) {
    case 'paid':
      return { text: `Pagado el ${formatShortDay(line.payment!.spentAt)}`, tone: 'muted' }
    case 'overdue':
      return { text: `Venció el ${line.dueDay}`, tone: 'danger' }
    case 'due_today':
      return { text: 'Vence hoy', tone: 'warning' }
    case 'upcoming':
      return { text: `Vence el ${line.dueDay}`, tone: 'muted' }
    case 'no_date':
      return { text: 'Sin fecha fija', tone: 'muted' }
  }
}
