import { db, type Expense } from '@/lib/db'
import type { ExpenseCategoryId } from './categories'

export interface NewExpense {
  amount: number
  category: ExpenseCategoryId
  note?: string
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
