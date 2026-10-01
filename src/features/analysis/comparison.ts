import { isFixed, totalsByCategory } from '@/features/expenses'
import type { Expense } from '@/lib/db'

// Change of variable spending per category against the month before, as a fraction (+0.18 is
// 18% more). For the month in progress the month before counts only up to the same day, so
// the 5th of October isn't compared with all of September. Categories the month before
// didn't have are left out: there's nothing to compare with.
export function changeByCategory(
  expenses: readonly Expense[],
  previous: readonly Expense[],
  inProgress: boolean,
  now: Date,
): Map<string, number> {
  const comparable = comparableSoFar(previous, inProgress, now)
  const before = new Map(
    totalsByCategory(comparable.filter((e) => !isFixed(e))).map((c) => [c.category, c.total]),
  )
  const changes = new Map<string, number>()
  for (const { category, total } of totalsByCategory(expenses.filter((e) => !isFixed(e)))) {
    const old = before.get(category)
    if (old) changes.set(category, (total - old) / old)
  }
  return changes
}

// Change of the whole variable spending against the month before, compared the same way;
// null when the month before had none
export function variableChange(
  expenses: readonly Expense[],
  previous: readonly Expense[],
  inProgress: boolean,
  now: Date,
): number | null {
  const variable = (list: readonly Expense[]) =>
    list.filter((e) => !isFixed(e)).reduce((sum, e) => sum + e.amount, 0)
  const before = variable(comparableSoFar(previous, inProgress, now))
  return before > 0 ? (variable(expenses) - before) / before : null
}

// The month before, cut at today's day of the month while this one is still going
function comparableSoFar(previous: readonly Expense[], inProgress: boolean, now: Date) {
  return inProgress
    ? previous.filter((e) => new Date(e.spentAt).getDate() <= now.getDate())
    : previous
}
