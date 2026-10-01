import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'

// A stand-in for the Supabase client: just the calls signOut and the sync make
const auth = vi.hoisted(() => ({
  signOut: vi.fn(),
  getSession: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth, from: vi.fn() } }))

const { signOut } = await import('./signOut')
const { runSync } = await import('@/lib/sync')

const expense = {
  id: 'a',
  amount: 100,
  category: 'other',
  spentAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  deleted: false,
  pending: 1 as const,
}

beforeEach(async () => {
  await db.expenses.clear()
  await db.syncState.clear()
  vi.restoreAllMocks()
})

afterEach(() => vi.unstubAllGlobals())

describe('signOut', () => {
  // Offline with an expired token, Supabase can't refresh it to sign out and keeps the session
  it("keeps this device's data when the session couldn't be ended", async () => {
    await db.expenses.add(expense)
    auth.signOut.mockResolvedValue({ error: new Error('Failed to fetch') })
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'me' } } } })

    expect(await signOut()).toBe(false)
    expect(await db.expenses.count()).toBe(1)
  })

  it('forgets the data once the session ended', async () => {
    await db.expenses.add(expense)
    auth.signOut.mockResolvedValue({ error: null })
    auth.getSession.mockResolvedValue({ data: { session: null } })

    expect(await signOut()).toBe(true)
    expect(await db.expenses.count()).toBe(0)
  })
})

describe('sync offline', () => {
  it("clears another user's data even without a connection", async () => {
    await db.syncState.put({ key: 'owner', value: 'someone-else' })
    await db.expenses.add(expense)
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'me' } } } })
    vi.stubGlobal('navigator', { onLine: false })

    await runSync()

    expect(await db.expenses.count()).toBe(0)
    expect(await db.syncState.get('owner')).toEqual({ key: 'owner', value: 'me' })
  })
})
