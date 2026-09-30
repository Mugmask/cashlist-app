import { beforeEach, describe, expect, it } from 'vitest'
import { getFixedPayments } from '@/features/expenses'
import { db } from '@/lib/db'
import { fixedRepo } from './fixedRepo'

beforeEach(async () => {
  await db.fixedExpenses.clear()
  await db.expenses.clear()
})

describe('fixedRepo', () => {
  it('pay records an expense linked to the fixed expense and the month', async () => {
    const id = await fixedRepo.create({
      name: 'Internet',
      category: 'utilities',
      amount: 20000,
      dueDay: 10,
    })
    const fixed = (await db.fixedExpenses.get(id))!

    const expenseId = await fixedRepo.pay(fixed, 20000, '2026-09')

    expect(await db.expenses.get(expenseId)).toMatchObject({
      amount: 20000,
      category: 'utilities',
      note: 'Internet',
      fixedExpenseId: id,
      fixedPeriod: '2026-09',
      pending: 1,
    })
    expect(await getFixedPayments('2026-09')).toHaveLength(1)
    expect(await getFixedPayments('2026-10')).toHaveLength(0)
  })

  it('paying a different amount makes it the suggested one from then on', async () => {
    const id = await fixedRepo.create({ name: 'Alquiler', category: 'rent', amount: 300000 })
    await fixedRepo.pay((await db.fixedExpenses.get(id))!, 345000, '2026-09')

    expect((await db.fixedExpenses.get(id))?.amount).toBe(345000)
  })

  it('undoPayment removes the payment, so the month shows it as unpaid again', async () => {
    const id = await fixedRepo.create({ name: 'Luz', category: 'utilities', amount: 15000 })
    const expenseId = await fixedRepo.pay((await db.fixedExpenses.get(id))!, 15000, '2026-09')

    await fixedRepo.undoPayment(expenseId)

    expect(await getFixedPayments('2026-09')).toHaveLength(0)
  })

  it('update can clear the due day', async () => {
    const id = await fixedRepo.create({ name: 'Gym', category: 'health', amount: 30000, dueDay: 5 })
    await fixedRepo.update(id, { name: 'Gym', category: 'health', amount: 32000 })

    expect(await db.fixedExpenses.get(id)).toMatchObject({ amount: 32000, dueDay: undefined })
  })
})
