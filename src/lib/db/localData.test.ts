import { beforeEach, describe, expect, it } from 'vitest'
import { claimLocalData, clearLocalData, countPendingChanges, db, type Expense } from '@/lib/db'

const expense = (id: string, pending: 0 | 1): Expense => ({
  id,
  amount: 100,
  category: 'other',
  spentAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  deleted: false,
  pending,
})

beforeEach(async () => {
  await clearLocalData()
})

describe('local data', () => {
  it('countPendingChanges counts the rows not uploaded yet, across tables', async () => {
    await db.expenses.bulkPut([expense('a', 1), expense('b', 0)])
    await db.profile.put({
      id: 'me',
      name: 'Juan',
      updatedAt: '2026-10-01T12:00:00Z',
      deleted: false,
      pending: 1,
    })

    expect(await countPendingChanges()).toBe(2)
  })

  it('clearLocalData empties every table, sync cursors included', async () => {
    await db.expenses.put(expense('a', 1))
    await db.syncState.put({ key: 'expenses', value: '2026-10-01T12:00:00Z' })

    await clearLocalData()

    expect(await db.expenses.count()).toBe(0)
    expect(await db.syncState.count()).toBe(0)
  })

  it('claimLocalData keeps the data of the same user', async () => {
    await claimLocalData('user-a')
    await db.expenses.put(expense('a', 1))

    await claimLocalData('user-a')

    expect(await db.expenses.count()).toBe(1)
  })

  it('claimLocalData clears the data another user left behind', async () => {
    await claimLocalData('user-a')
    await db.expenses.put(expense('a', 1))
    await db.syncState.put({ key: 'expenses', value: '2026-10-01T12:00:00Z' })

    await claimLocalData('user-b')

    expect(await db.expenses.count()).toBe(0)
    expect(await db.syncState.get('expenses')).toBeUndefined()
    expect(await db.syncState.get('owner')).toEqual({ key: 'owner', value: 'user-b' })
  })

  it('claimLocalData adopts data with no owner yet (from before owners existed)', async () => {
    await db.expenses.put(expense('a', 1))

    await claimLocalData('user-a')

    expect(await db.expenses.count()).toBe(1)
  })
})

describe('updatedAt of a local change', () => {
  it('always moves forward, even with this device clock behind the version it changes', async () => {
    // A version written by a device whose clock runs ahead
    await db.expenses.put(expense('a', 0))
    await db.expenses.update('a', { updatedAt: '2026-10-01T12:05:00.000Z', pending: 0 })

    // Edited here at 12:02, by this device's clock
    await db.expenses.update('a', {
      amount: 200,
      updatedAt: '2026-10-01T12:02:00.000Z',
      pending: 1,
    })

    expect((await db.expenses.get('a'))?.updatedAt).toBe('2026-10-01T12:05:00.001Z')
  })

  it('leaves rows coming from the server as they are', async () => {
    await db.expenses.put(expense('a', 0))
    await db.expenses.update('a', { updatedAt: '2026-10-01T12:05:00.000Z', pending: 0 })
    await db.expenses.update('a', { updatedAt: '2026-10-01T11:00:00.000Z', pending: 0 })

    expect((await db.expenses.get('a'))?.updatedAt).toBe('2026-10-01T11:00:00.000Z')
  })
})
