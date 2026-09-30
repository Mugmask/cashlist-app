import type { Budget, Expense } from '@/lib/db'

export interface BudgetLine {
  category: string
  limit: number
  spent: number
  remaining: number // negative once over the limit
  ratio: number // spent / limit
}

export interface UnbudgetedCategory {
  category: string
  spent: number
}

export interface BudgetOverview {
  lines: BudgetLine[] // closest to (or furthest past) the limit first
  unbudgeted: UnbudgetedCategory[] // in the given category order
  // Only over budgeted categories: spending without a limit doesn't eat into the budget
  totals: { limit: number; spent: number; remaining: number }
}

export function buildBudgetOverview(
  budgets: readonly Budget[],
  expenses: readonly Expense[],
  categories: readonly string[],
): BudgetOverview {
  const spentBy = new Map<string, number>()
  for (const { category, amount } of expenses) {
    spentBy.set(category, (spentBy.get(category) ?? 0) + amount)
  }

  const lines = budgets
    .map((b): BudgetLine => {
      const spent = spentBy.get(b.id) ?? 0
      return {
        category: b.id,
        limit: b.amount,
        spent,
        remaining: b.amount - spent,
        ratio: spent / b.amount,
      }
    })
    .sort((a, b) => b.ratio - a.ratio)

  const budgeted = new Set(lines.map((l) => l.category))
  const unbudgeted = categories
    .filter((c) => !budgeted.has(c))
    .map((category) => ({ category, spent: spentBy.get(category) ?? 0 }))

  const limit = lines.reduce((sum, l) => sum + l.limit, 0)
  const spent = lines.reduce((sum, l) => sum + l.spent, 0)

  return { lines, unbudgeted, totals: { limit, spent, remaining: limit - spent } }
}
