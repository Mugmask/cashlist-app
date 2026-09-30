import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { budgetsRepo } from './budgetsRepo'

beforeEach(async () => {
  await db.budgets.clear()
})

describe('budgetsRepo', () => {
  it('set stores one budget per category, keyed by category, pending upload', async () => {
    const now = new Date('2026-09-10T10:00:00Z')
    await budgetsRepo.set('groceries', 100, now)
    await budgetsRepo.set('groceries', 150, now) // replaces, doesn't duplicate

    expect(await db.budgets.toArray()).toEqual([
      { id: 'groceries', amount: 150, updatedAt: now.toISOString(), deleted: false, pending: 1 },
    ])
  })

  it('remove soft-deletes, and set revives the same row', async () => {
    await budgetsRepo.set('rent', 1000)
    await budgetsRepo.remove('rent')
    expect(await budgetsRepo.active()).toEqual([])
    expect(await db.budgets.get('rent')).toMatchObject({ deleted: true, pending: 1 })

    await budgetsRepo.set('rent', 1200)
    expect(await budgetsRepo.active()).toMatchObject([{ id: 'rent', amount: 1200 }])
  })
})
