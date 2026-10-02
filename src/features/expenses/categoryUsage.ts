import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Expense } from '@/lib/db'
import type { Category } from './categories'

const RECENT_DAYS = 90 // what "the ones you use" means: the last three months

// The categories with the most used first (by how many expenses of the last months have
// each), the rest in their usual order. Fixed expenses' payments don't count: they're paid
// from their own form, not picked here.
export function rankByUse(categories: readonly Category[], expenses: readonly Expense[]) {
  const uses = new Map<string, number>()
  for (const e of expenses) {
    if (e.deleted || e.fixedExpenseId) continue
    uses.set(e.category, (uses.get(e.category) ?? 0) + 1)
  }
  return categories
    .map((category, index) => ({ category, index, uses: uses.get(category.id) ?? 0 }))
    .sort((a, b) => b.uses - a.uses || a.index - b.index)
    .map((c) => c.category)
}

// The recent expenses rankByUse reads; undefined while loading
export function useRecentExpenses() {
  return useLiveQuery(() => {
    const since = new Date()
    since.setDate(since.getDate() - RECENT_DAYS)
    return db.expenses.where('spentAt').above(since.toISOString()).toArray()
  })
}
