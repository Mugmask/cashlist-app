import type { Expense, FixedExpense } from '@/lib/db'
import { daysInMonth } from '@/utils/dates'

export type FixedStatus = 'paid' | 'overdue' | 'due_today' | 'upcoming' | 'no_date'

export interface FixedLine {
  fixed: FixedExpense
  status: FixedStatus
  dueDay?: number // clamped to the month's length (31 → 30 in September)
  payment?: Expense // this month's payment, when paid
  amount: number // what was paid, or what's expected
}

export interface FixedOverview {
  pending: FixedLine[] // overdue first, then due today, then by due day; undated last
  paid: FixedLine[] // most recently paid first
  totals: { expected: number; paid: number; remaining: number }
}

const STATUS_ORDER: Record<FixedStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  no_date: 3,
  paid: 4,
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

// Where each fixed expense stands this month. `payments` are this month's fixed payments.
export function buildFixedOverview(
  fixed: readonly FixedExpense[],
  payments: readonly Expense[],
  today: Date,
): FixedOverview {
  const paymentBy = new Map<string, Expense>()
  for (const p of payments) {
    if (!p.fixedExpenseId) continue
    const current = paymentBy.get(p.fixedExpenseId)
    if (!current || p.spentAt > current.spentAt) paymentBy.set(p.fixedExpenseId, p)
  }

  const lastDay = daysInMonth(today)
  const lines = fixed.map((f): FixedLine => {
    const payment = paymentBy.get(f.id)
    const dueDay = f.dueDay === undefined ? undefined : Math.min(f.dueDay, lastDay)
    return {
      fixed: f,
      dueDay,
      payment,
      amount: payment?.amount ?? f.amount,
      status: payment ? 'paid' : statusFor(dueDay, today.getDate()),
    }
  })

  const pending = lines
    .filter((l) => l.status !== 'paid')
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.dueDay ?? 0) - (b.dueDay ?? 0) ||
        collator.compare(a.fixed.name, b.fixed.name),
    )
  const paid = lines
    .filter((l) => l.status === 'paid')
    .sort((a, b) => b.payment!.spentAt.localeCompare(a.payment!.spentAt))

  const expected = lines.reduce((sum, l) => sum + l.amount, 0)
  const paidTotal = paid.reduce((sum, l) => sum + l.amount, 0)

  return {
    pending,
    paid,
    totals: { expected, paid: paidTotal, remaining: expected - paidTotal },
  }
}

function statusFor(dueDay: number | undefined, dayOfMonth: number): FixedStatus {
  if (dueDay === undefined) return 'no_date'
  if (dueDay < dayOfMonth) return 'overdue'
  if (dueDay === dayOfMonth) return 'due_today'
  return 'upcoming'
}
