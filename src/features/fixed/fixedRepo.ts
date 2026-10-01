import { addExpense, removeExpense } from '@/features/expenses'
import { db, type FixedExpense, type PaymentMethod } from '@/lib/db'
import { toPesos } from '@/lib/exchangeRates'
import type { ConversionRate } from '@/lib/useDollarRate'

export interface FixedExpenseInput {
  name: string
  category: string
  amount: number // in dollars when currency is USD
  paymentMethod: PaymentMethod
  currency?: 'USD'
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
    // currency has to clear the stored one
    const existing = await db.fixedExpenses.get(id)
    if (!existing) return
    await db.fixedExpenses.put({
      ...existing,
      ...input,
      currency: input.currency,
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

  // Records this month's payment as an expense, made at `paidAt` (now by default). A different
  // amount (prices went up) becomes the one suggested from now on. A dollar one is paid in
  // dollars, converted at `rate`.
  async pay(
    fixed: FixedExpense,
    amount: number,
    period: string,
    rate?: ConversionRate,
    paidAt?: string,
    now = new Date(),
  ) {
    if (fixed.currency === 'USD' && !rate) throw new Error('A dollar payment needs a rate')
    const money =
      fixed.currency === 'USD' && rate
        ? {
            amount: toPesos(amount, rate.rate),
            currency: 'USD' as const,
            foreignAmount: amount,
            exchangeRate: rate.rate,
            exchangeRateKind: rate.kind,
          }
        : { amount }
    const expenseId = await addExpense({
      ...money,
      category: fixed.category,
      name: fixed.name,
      fixedExpenseId: fixed.id,
      fixedPeriod: period,
      paymentMethod: fixed.paymentMethod ?? 'cash',
      spentAt: paidAt,
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
