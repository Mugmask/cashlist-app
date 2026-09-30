import { addExpense, removeExpense } from '@/features/expenses'
import { db, type FixedExpense, type PaymentMethod } from '@/lib/db'

export interface FixedExpenseInput {
  name: string
  category: string
  amount: number
  dueDay?: number
  paymentMethod: PaymentMethod
}

// Single entry point to local fixed expenses: components never touch Dexie directly
export const fixedRepo = {
  async create(input: FixedExpenseInput, now = new Date()) {
    const item: FixedExpense = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    }
    await db.fixedExpenses.add(item)
    return item.id
  },

  async update(id: string, input: FixedExpenseInput, now = new Date()) {
    // A full put, not update(): Dexie's update() skips undefined fields, and a missing
    // dueDay has to clear the stored one
    const existing = await db.fixedExpenses.get(id)
    if (!existing) return
    await db.fixedExpenses.put({
      ...existing,
      ...input,
      dueDay: input.dueDay,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  async remove(id: string, now = new Date()) {
    await db.fixedExpenses.update(id, { deleted: true, updatedAt: now.toISOString(), pending: 1 })
  },

  async active() {
    return (await db.fixedExpenses.toArray()).filter((f) => !f.deleted)
  },

  // Records this month's payment as an expense. A different amount (prices went up) becomes
  // the one suggested from now on.
  async pay(fixed: FixedExpense, amount: number, period: string, now = new Date()) {
    const expenseId = await addExpense({
      amount,
      category: fixed.category,
      note: fixed.name,
      fixedExpenseId: fixed.id,
      fixedPeriod: period,
      paymentMethod: fixed.paymentMethod ?? 'cash',
    })
    if (amount !== fixed.amount) {
      await db.fixedExpenses.update(fixed.id, {
        amount,
        updatedAt: now.toISOString(),
        pending: 1,
      })
    }
    return expenseId
  },

  undoPayment(expenseId: string) {
    return removeExpense(expenseId)
  },
}
