import { beforeEach, describe, expect, it } from 'vitest'
import { clearLocalData, db } from '@/lib/db'
import { resetDemo, seedDemoIfEmpty } from './seedDemo'

describe('seedDemoIfEmpty', () => {
  beforeEach(() => clearLocalData())

  it('fills an empty browser', async () => {
    await seedDemoIfEmpty()
    expect(await db.expenses.count()).toBeGreaterThan(0)
    expect(await db.fixedExpenses.count()).toBeGreaterThan(0)
    expect((await db.profile.get('me'))?.name).toBe('Alex')
  })

  it("doesn't touch a browser that already has data", async () => {
    await db.shoppingItems.add({
      id: 'mine',
      name: 'Yerba',
      quantity: 1,
      status: 'to_buy',
      timesBought: 0,
      updatedAt: new Date().toISOString(),
      deleted: false,
      pending: 0,
    })
    await seedDemoIfEmpty()
    expect(await db.expenses.count()).toBe(0)
  })

  it('leaves it empty once the demo data was deleted', async () => {
    await seedDemoIfEmpty()
    await db.expenses.clear()
    await db.fixedExpenses.clear()
    await db.shoppingItems.clear()
    await seedDemoIfEmpty()
    expect(await db.expenses.count()).toBe(0)
  })
})

describe('resetDemo', () => {
  beforeEach(() => clearLocalData())

  it('brings back the demo data, dropping what was added', async () => {
    await seedDemoIfEmpty()
    const seeded = await db.expenses.count()
    await db.expenses.add({
      id: 'extra',
      amount: 1,
      category: 'other',
      spentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
      pending: 0,
    })
    await resetDemo()
    expect(await db.expenses.count()).toBe(seeded)
    expect(await db.expenses.get('extra')).toBeUndefined()
  })
})
