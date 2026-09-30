import { db, type Expense } from '@/lib/db'
import { startOfMonth } from '@/utils/dates'
import type { ExpenseCategoryId } from './categories'

export interface NewExpense {
  amount: number
  category: ExpenseCategoryId
  note?: string
}

// This month's expenses. Meant to be called inside a live query (it reads the database),
// so other features can combine it with their own data in a single query.
export function getMonthExpenses(now: Date) {
  return expensesRepo.since(startOfMonth(now))
}

// Single entry point to local expenses: components never touch Dexie directly
export const expensesRepo = {
  async add(data: NewExpense, now = new Date()) {
    const iso = now.toISOString()
    const id = crypto.randomUUID()
    const expense: Expense = {
      ...data,
      id,
      spentAt: iso,
      updatedAt: iso,
      deleted: false,
      pending: 1,
    }
    await db.expenses.add(expense)
    return id
  },

  async remove(id: string, now = new Date()) {
    await db.expenses.update(id, {
      deleted: true,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  // Non-deleted expenses since a date, newest first
  since(date: Date) {
    return db.expenses
      .where('spentAt')
      .aboveOrEqual(date.toISOString())
      .reverse()
      .filter((e) => !e.deleted)
      .toArray()
  },
}
