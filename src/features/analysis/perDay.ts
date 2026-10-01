import { isFixed, type MonthExpense } from '@/features/expenses'
import { daysInMonth, toPeriod } from '@/utils/dates'

// Variable spending: what you decide day by day. Fixed payments (rent...) and installments
// of earlier purchases are spoken for already; on a day they'd say nothing about the pace.
function variableOf(expenses: readonly MonthExpense[], month: Date) {
  const period = toPeriod(month)
  return expenses.filter((e) => !isFixed(e) && toPeriod(new Date(e.spentAt)) === period)
}

export interface Week {
  from: number // first day of the month in it (1-based)
  to: number // last one
  total: number // variable spending in those days
  when: 'past' | 'current' | 'future' // against today; a month gone is all 'past'
}

// The month in four weeks: 1–7, 8–14, 15–21 and 22 to the end (a week of 2 or 3 days would
// look like you barely spent). `today` is the day of the month, null for a month gone.
export function weeksOf(
  expenses: readonly MonthExpense[],
  month: Date,
  today: number | null,
): Week[] {
  const days = daysInMonth(month)
  const weeks = [1, 8, 15, 22].map((from, i, starts) => ({
    from,
    to: i < starts.length - 1 ? starts[i + 1] - 1 : days,
    cents: 0,
  }))
  for (const e of variableOf(expenses, month)) {
    const day = new Date(e.spentAt).getDate()
    weeks.find((w) => day <= w.to)!.cents += Math.round(e.amount * 100)
  }
  return weeks.map(({ from, to, cents }) => ({
    from,
    to,
    total: cents / 100,
    when: today === null || to < today ? 'past' : from > today ? 'future' : 'current',
  }))
}

export interface PerDay {
  pace: number // variable spending per day so far (the whole month, for one gone)
  // Only for the month going on, with an income to measure against:
  budget?: {
    perDay: number // what can still go each day, today included, to end the month even
    daysLeft: number // today included
    free: number // what's left once the fixed ones still to pay are paid; < 0: over
    projected: number // what would be left at the end at this pace; < 0: short
  }
}

// How the month goes per day. `available` is what the month has (income plus what the months
// before carried), `spent` everything counted in it, `committed` fixed expenses not paid yet.
export function perDay({
  expenses,
  month,
  today,
  available,
  spent,
  committed,
}: {
  expenses: readonly MonthExpense[]
  month: Date
  today: number | null // day of the month going on; null for one gone
  available?: number
  spent: number
  committed: number
}): PerDay {
  const days = daysInMonth(month)
  const variable = variableOf(expenses, month).reduce((sum, e) => sum + e.amount, 0)
  const elapsed = today ?? days
  const pace = Math.round(variable / elapsed)
  if (today === null || available === undefined) return { pace }

  const daysLeft = days - today + 1
  const free = available - spent - committed
  return {
    pace,
    budget: {
      perDay: free > 0 ? Math.floor(free / daysLeft) : 0,
      daysLeft,
      free,
      // Today's spending is already in `spent`: the pace runs over the days after it
      projected: free - pace * (days - today),
    },
  }
}
