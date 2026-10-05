import { beforeEach, describe, expect, it } from 'vitest'
import { getFixedPayments } from '@/features/expenses'
import { db } from '@/lib/db'
import { fixedRepo } from './fixedRepo'

beforeEach(async () => {
  await db.fixedExpenses.clear()
  await db.expenses.clear()
})

describe('fixedRepo', () => {
  it('pay records it on the day it was paid, when given', async () => {
    const id = await fixedRepo.create({
      name: 'Monotributo',
      category: 'utilities',
      amount: 125000,
      paymentMethod: 'cash',
    })
    const paidAt = '2026-09-08T12:00:00.000Z'

    const expenseId = await fixedRepo.pay(
      (await db.fixedExpenses.get(id))!,
      125000,
      '2026-09',
      undefined,
      { paidAt, note: 'Con recargo' },
    )

    expect(await db.expenses.get(expenseId)).toMatchObject({
      spentAt: paidAt,
      fixedPeriod: '2026-09',
      note: 'Con recargo',
    })
  })

  it('pay records an expense linked to the fixed expense and the month', async () => {
    const id = await fixedRepo.create({
      name: 'Internet',
      category: 'utilities',
      amount: 20000,
      paymentMethod: 'cash',
    })
    const fixed = (await db.fixedExpenses.get(id))!

    const expenseId = await fixedRepo.pay(fixed, 20000, '2026-09')

    expect(await db.expenses.get(expenseId)).toMatchObject({
      amount: 20000,
      category: 'utilities',
      name: 'Internet',
      fixedExpenseId: id,
      fixedPeriod: '2026-09',
      pending: 1,
    })
    expect(await getFixedPayments('2026-09')).toHaveLength(1)
    expect(await getFixedPayments('2026-10')).toHaveLength(0)
  })

  it('pay of a shared one records my part, with the whole bill as its shared total', async () => {
    const id = await fixedRepo.create({
      name: 'Alquiler',
      category: 'rent',
      amount: 650000,
      paymentMethod: 'cash',
      shareWith: 2,
    })

    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 700000, '2026-09')

    expect(await db.expenses.get(expenseId)).toMatchObject({ amount: 350000, sharedTotal: 700000 })
    // The bill, not my part, is what's suggested next month
    expect((await db.fixedExpenses.get(id))!.amount).toBe(700000)
  })

  it('pay of one not shared leaves no shared total', async () => {
    const id = await fixedRepo.create({
      name: 'Luz',
      category: 'utilities',
      amount: 40000,
      paymentMethod: 'cash',
    })
    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 40000, '2026-09')
    expect((await db.expenses.get(expenseId))!.sharedTotal).toBeUndefined()
  })

  it('paying a different amount makes it the suggested one from then on', async () => {
    const id = await fixedRepo.create({
      name: 'Alquiler',
      category: 'rent',
      amount: 300000,
      paymentMethod: 'cash',
    })
    await fixedRepo.pay((await db.fixedExpenses.get(id))!, 345000, '2026-09')

    expect((await db.fixedExpenses.get(id))?.amount).toBe(345000)
  })

  it('paying an old month at its old price keeps the amount of the latest month paid', async () => {
    const id = await fixedRepo.create({
      name: 'Alquiler',
      category: 'rent',
      amount: 600000,
      paymentMethod: 'cash',
    })
    await fixedRepo.pay((await db.fixedExpenses.get(id))!, 700000, '2026-10') // it went up
    await fixedRepo.pay((await db.fixedExpenses.get(id))!, 600000, '2026-08') // catching up

    expect((await db.fixedExpenses.get(id))?.amount).toBe(700000)
  })

  it('undoPayment removes the payment, so the month shows it as unpaid again', async () => {
    const id = await fixedRepo.create({
      name: 'Luz',
      category: 'utilities',
      amount: 15000,
      paymentMethod: 'cash',
    })
    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 15000, '2026-09')

    await fixedRepo.undoPayment(expenseId)

    expect(await getFixedPayments('2026-09')).toHaveLength(0)
  })

  it('a fixed expense paid by card records its payment as a card expense', async () => {
    const id = await fixedRepo.create({
      name: 'Netflix',
      category: 'subscriptions',
      amount: 9990,
      paymentMethod: 'card',
    })
    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 9990, '2026-09')

    expect((await db.expenses.get(expenseId))?.paymentMethod).toBe('card')
  })

  it('a dollar fixed expense is paid in dollars, converted at the given rate', async () => {
    const id = await fixedRepo.create({
      name: 'Spotify',
      category: 'subscriptions',
      amount: 12,
      paymentMethod: 'card',
      currency: 'USD',
    })
    const rate = { kind: 'tarjeta' as const, rate: 2002 }
    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 13, '2026-09', rate)

    expect(await db.expenses.get(expenseId)).toMatchObject({
      amount: 26026,
      currency: 'USD',
      foreignAmount: 13,
      exchangeRate: 2002,
      exchangeRateKind: 'tarjeta',
    })
    // the new dollar amount is the one suggested from now on
    expect((await db.fixedExpenses.get(id))?.amount).toBe(13)
  })

  it('update back to pesos clears the currency', async () => {
    const input = { name: 'VPN', category: 'other', amount: 5, paymentMethod: 'cash' as const }
    const id = await fixedRepo.create({ ...input, currency: 'USD' })
    await fixedRepo.update(id, { ...input, amount: 7000 })

    expect((await db.fixedExpenses.get(id))?.currency).toBeUndefined()
  })
})
