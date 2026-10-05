import type { ExchangeRateKind, Expense, FixedExpense } from '@/lib/db'
import { rateKindFor, toPesos } from '@/lib/exchangeRates'
import type { Currency } from '@/utils/currency'
import { daysInMonth, fromPeriod } from '@/utils/dates'

export interface FixedLine {
  fixed: FixedExpense
  payment?: Expense // this month's payment; missing while still to pay
  // Pesos, for the totals: what was paid, or what's expected. A dollar one not paid yet is
  // estimated at today's rate (0 until a rate is known).
  amount: number
  shown: { value: number; currency: Currency } // what the list shows: dollars stay dollars
  // Still to pay with a due day: that day in the month (31 is September's 30th) and how many
  // days are left until it, from today; less than 0 once it's gone by
  due?: { day: number; daysLeft: number }
}

// Pesos per dollar by kind, today's; the ones not known yet are missing
export type TodayRates = Partial<Record<ExchangeRateKind, number>>

export interface FixedOverview {
  pending: FixedLine[] // the ones due soonest first, those without a due day last; then by name
  paid: FixedLine[] // most recently paid first
  totals: { expected: number; paid: number; remaining: number }
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

// Which fixed expenses a month shows. This month (and later): the ones there now. A month
// gone: every one paid in it, even if deleted since, and the ones already in use by then
// (`inUse`: paid that month or before) and not deleted, as still to pay. One created later
// doesn't show up as owed in a month before it existed.
export function fixedForPeriod(
  all: readonly FixedExpense[],
  payments: readonly Expense[],
  inUse: ReadonlySet<string>,
  gone: boolean,
): FixedExpense[] {
  if (!gone) return all.filter((f) => !f.deleted)
  const paid = new Set(payments.map((p) => p.fixedExpenseId))
  return all.filter((f) => paid.has(f.id) || (!f.deleted && inUse.has(f.id)))
}

const DAY_MS = 24 * 60 * 60 * 1000

// Days from `today` to `day` of `period`'s month ("2026-09"), the due day clamped to the
// month's length. Calendar days: the hour of `today` doesn't count.
export function dueIn(period: string, dueDay: number, today: Date) {
  const month = fromPeriod(period)
  const day = Math.min(dueDay, daysInMonth(month))
  const due = Date.UTC(month.getFullYear(), month.getMonth(), day)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return { day, daysLeft: Math.round((due - now) / DAY_MS) }
}

// Where each fixed expense stands in a month: paid or not. `payments` are that month's fixed
// payments. With `when` (the month and today), the ones still to pay say when they're due.
export function buildFixedOverview(
  fixed: readonly FixedExpense[],
  payments: readonly Expense[],
  rates: TodayRates = {},
  when?: { period: string; today: Date },
): FixedOverview {
  const paymentBy = new Map<string, Expense>()
  for (const p of payments) {
    if (!p.fixedExpenseId) continue
    const current = paymentBy.get(p.fixedExpenseId)
    if (!current || p.spentAt > current.spentAt) paymentBy.set(p.fixedExpenseId, p)
  }

  const lines = fixed.map((f): FixedLine => {
    const payment = paymentBy.get(f.id)
    return {
      fixed: f,
      payment,
      amount: payment?.amount ?? expectedPesos(f, rates),
      shown: payment ? shownPayment(payment) : { value: f.amount, currency: f.currency ?? 'ARS' },
      ...(!payment &&
        when &&
        f.dueDay !== undefined && { due: dueIn(when.period, f.dueDay, when.today) }),
    }
  })

  const pending = lines
    .filter((l) => !l.payment)
    .sort(
      (a, b) =>
        (a.due?.daysLeft ?? Infinity) - (b.due?.daysLeft ?? Infinity) ||
        collator.compare(a.fixed.name, b.fixed.name),
    )
  const paid = lines
    .filter((l) => l.payment)
    .sort((a, b) => b.payment!.spentAt.localeCompare(a.payment!.spentAt))

  const expected = lines.reduce((sum, l) => sum + l.amount, 0)
  const paidTotal = paid.reduce((sum, l) => sum + l.amount, 0)

  return {
    pending,
    paid,
    totals: { expected, paid: paidTotal, remaining: expected - paidTotal },
  }
}

function expectedPesos(f: FixedExpense, rates: TodayRates) {
  if (f.currency !== 'USD') return f.amount
  const rate = rates[rateKindFor(f.paymentMethod ?? 'cash')]
  return rate ? toPesos(f.amount, rate) : 0
}

function shownPayment(p: Expense): FixedLine['shown'] {
  return p.currency === 'USD'
    ? { value: p.foreignAmount!, currency: 'USD' }
    : { value: p.amount, currency: 'ARS' }
}
