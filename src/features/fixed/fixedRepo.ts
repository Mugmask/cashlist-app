import { addExpense, getPaymentsOf, removeExpense } from '@/features/expenses'
import { db, type FixedExpense, type PaymentMethod } from '@/lib/db'
import { toPesos } from '@/lib/exchangeRates'
import type { ConversionRate } from '@/lib/useDollarRate'
import { isShared, myPartOf } from './fixedShare'

export interface FixedExpenseInput {
  name: string
  category: string
  amount: number // in dollars when currency is USD
  paymentMethod: PaymentMethod
  currency?: 'USD'
  dueDay?: number // 1 to 31
  shareWith?: number // an even split between 2 to 4
  sharePart?: number // or my exact part
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
      dueDay: input.dueDay,
      shareWith: input.shareWith,
      sharePart: input.sharePart,
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

  // Deleted ones too: a month gone still shows what was paid then
  all() {
    return db.fixedExpenses.toArray()
  },

  // Records this month's payment as an expense, made at `paidAt` (now by default). A different
  // amount (prices went up) becomes the one suggested from now on. A dollar one is paid in
  // dollars, converted at `rate`. `amount` is the whole bill: a shared one records my part of
  // it, keeping the bill as the expense's sharedTotal.
  async pay(
    fixed: FixedExpense,
    amount: number,
    period: string,
    rate?: ConversionRate,
    paidAt?: string,
    now = new Date(),
  ) {
    if (fixed.currency === 'USD' && !rate) throw new Error('A dollar payment needs a rate')
    const mine = myPartOf(fixed, amount)
    const shared = isShared(fixed)
    const money =
      fixed.currency === 'USD' && rate
        ? {
            amount: toPesos(mine, rate.rate),
            currency: 'USD' as const,
            foreignAmount: mine,
            exchangeRate: rate.rate,
            exchangeRateKind: rate.kind,
            ...(shared && { sharedTotal: toPesos(amount, rate.rate) }),
          }
        : { amount: mine, ...(shared && { sharedTotal: amount }) }
    const expenseId = await addExpense({
      ...money,
      category: fixed.category,
      name: fixed.name,
      fixedExpenseId: fixed.id,
      fixedPeriod: period,
      paymentMethod: fixed.paymentMethod ?? 'cash',
      spentAt: paidAt,
    })
    // The amount suggested next time follows the latest month paid: catching up on an old
    // month at its old price doesn't take back a raise already paid since
    const latest = (await getPaymentsOf(fixed.id))[0]?.fixedPeriod
    if (amount !== fixed.amount && (!latest || period >= latest)) {
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
