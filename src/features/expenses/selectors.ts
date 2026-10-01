import type { Expense } from '@/lib/db'
import { toDayKey, toPeriod } from '@/utils/dates'
import { getCategory } from './categories'

export interface DayGroup<T extends Expense = Expense> {
  key: string
  date: string // ISO of the first expense in the group, for the heading
  expenses: T[]
  total: number
}

export interface CategoryTotal {
  category: string
  total: number
  count: number
}

export interface MonthSummary {
  total: number
  fixedTotal: number // payments of fixed expenses
  variableTotal: number // everything else: what you actually control day to day
}

export function isFixed(expense: Expense) {
  return expense.fixedExpenseId !== undefined
}

// The first month kept whole in the app ("2026-09"): the first with a fixed expense paid.
// Earlier months only hold card purchases loaded for their installments. Undefined without
// any fixed payment. By the month a payment pays: September's rent paid on August 31st
// doesn't make August a month kept whole.
export function firstTrackedPeriod(expenses: readonly Expense[]): string | undefined {
  return expenses
    .filter(isFixed)
    .map((e) => e.fixedPeriod ?? toPeriod(new Date(e.spentAt)))
    .reduce<string | undefined>(
      (first, p) => (first === undefined || p < first ? p : first),
      undefined,
    )
}

export function summarizeMonth(expenses: readonly Expense[]): MonthSummary {
  let fixedTotal = 0
  let variableTotal = 0
  for (const e of expenses) {
    if (isFixed(e)) fixedTotal += e.amount
    else variableTotal += e.amount
  }
  return {
    total: fixedTotal + variableTotal,
    fixedTotal,
    variableTotal,
  }
}

// Groups consecutive expenses by local day, keeping the input order (newest first)
export function groupByDay<T extends Expense>(expenses: readonly T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  for (const expense of expenses) {
    const key = toDayKey(new Date(expense.spentAt))
    let group = groups.at(-1)
    if (group?.key !== key) {
      group = { key, date: expense.spentAt, expenses: [], total: 0 }
      groups.push(group)
    }
    group.expenses.push(expense)
    group.total += expense.amount
  }
  return groups
}

// Total per category, biggest first
export function totalsByCategory(expenses: readonly Expense[]): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>()
  for (const e of expenses) {
    // By the category it shows as: one folded into another adds to it
    const category = getCategory(e.category).id
    const { amount } = e
    const entry = byCategory.get(category) ?? { category, total: 0, count: 0 }
    entry.total += amount
    entry.count += 1
    byCategory.set(category, entry)
  }
  return [...byCategory.values()].sort((a, b) => b.total - a.total)
}
