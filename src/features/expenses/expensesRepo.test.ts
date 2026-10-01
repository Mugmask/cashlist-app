import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { expensesRepo, getMonthExpenses } from './expensesRepo'

beforeEach(async () => {
  await db.expenses.clear()
})

describe('expensesRepo', () => {
  it('add stores the expense as pending upload', async () => {
    const now = new Date('2026-09-15T12:00:00Z')
    const id = await expensesRepo.add({ amount: 1500, category: 'groceries' }, now)

    expect(await db.expenses.get(id)).toEqual({
      id,
      amount: 1500,
      category: 'groceries',
      spentAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  })

  it('add can take the day it happened, loaded later', async () => {
    const now = new Date('2026-09-15T12:00:00Z')
    const spentAt = '2026-09-08T12:00:00.000Z'
    const id = await expensesRepo.add({ amount: 1500, category: 'groceries', spentAt }, now)

    expect(await db.expenses.get(id)).toMatchObject({ spentAt, updatedAt: now.toISOString() })
  })

  it('update applies the changes, bumps updatedAt and marks it pending', async () => {
    const id = await expensesRepo.add(
      { amount: 800, category: 'delivery', note: 'Pizza' },
      new Date('2026-09-15T12:00:00Z'),
    )
    await db.expenses.update(id, { pending: 0 })

    const later = new Date('2026-09-16T08:00:00Z')
    await expensesRepo.update(id, { amount: 950, category: 'personal', note: undefined }, later)

    const stored = await db.expenses.get(id)
    expect(stored).toMatchObject({
      amount: 950,
      category: 'personal',
      spentAt: '2026-09-15T12:00:00.000Z',
      updatedAt: later.toISOString(),
      pending: 1,
    })
    expect(stored?.note).toBeUndefined()
  })

  it('restore brings a removed expense back, pending upload', async () => {
    const id = await expensesRepo.add({ amount: 800, category: 'delivery' })
    await expensesRepo.remove(id, new Date('2026-09-16T08:00:00Z'))
    await db.expenses.update(id, { pending: 0 }) // the removal already uploaded

    const later = new Date('2026-09-16T08:00:05Z')
    await expensesRepo.restore(id, later)

    expect(await db.expenses.get(id)).toMatchObject({
      amount: 800,
      deleted: false,
      updatedAt: later.toISOString(),
      pending: 1,
    })
  })

  it('remove soft-deletes, bumps updatedAt and marks it pending', async () => {
    const id = await expensesRepo.add(
      { amount: 800, category: 'delivery' },
      new Date('2026-09-15T12:00:00Z'),
    )
    await db.expenses.update(id, { pending: 0 }) // as if it had already been uploaded

    const later = new Date('2026-09-16T08:00:00Z')
    await expensesRepo.remove(id, later)

    expect(await db.expenses.get(id)).toMatchObject({
      deleted: true,
      updatedAt: later.toISOString(),
      pending: 1,
    })
  })

  it('since returns only non-deleted expenses from the date on, newest first', async () => {
    const august = await expensesRepo.add(
      { amount: 1, category: 'other' },
      new Date('2026-08-31T23:00:00Z'),
    )
    const first = await expensesRepo.add(
      { amount: 2, category: 'other' },
      new Date('2026-09-02T10:00:00Z'),
    )
    const second = await expensesRepo.add(
      { amount: 3, category: 'other' },
      new Date('2026-09-10T10:00:00Z'),
    )
    const deleted = await expensesRepo.add(
      { amount: 4, category: 'other' },
      new Date('2026-09-12T10:00:00Z'),
    )
    await expensesRepo.remove(deleted)

    const ids = (await expensesRepo.since(new Date('2026-09-01T00:00:00Z'))).map((e) => e.id)

    expect(ids).toEqual([second, first])
    expect(ids).not.toContain(august)
  })

  it("getMonthExpenses counts each installment in its month, and earlier purchases' too", async () => {
    await expensesRepo.add(
      { amount: 300000, category: 'other', paymentMethod: 'card', installments: 3 },
      new Date(2026, 6, 18, 12), // July
    )
    await expensesRepo.add({ amount: 9000, category: 'groceries' }, new Date(2026, 8, 3, 12))
    await expensesRepo.add({ amount: 5000, category: 'groceries' }, new Date(2026, 7, 3, 12))

    const september = await getMonthExpenses(new Date(2026, 8, 1))
    expect(september.map((e) => [e.amount, e.installment?.number])).toEqual([
      [9000, undefined],
      [100000, 3], // the July purchase's 3rd installment
    ])
    expect(await getMonthExpenses(new Date(2026, 9, 1))).toEqual([]) // all paid by October
  })
})
