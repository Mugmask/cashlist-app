import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { expensesRepo } from './expensesRepo'

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
})
