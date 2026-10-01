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
  const comparable = inProgress
    ? previous.filter((e) => new Date(e.spentAt).getDate() <= now.getDate())
    : previous
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
