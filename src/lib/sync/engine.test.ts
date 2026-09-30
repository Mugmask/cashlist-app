import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type Expense } from '@/lib/db'
import { pullTable, pushTable } from './engine'
import { expensesTable } from './tables'

interface Payload {
  id: string
  updated_at: string
  [column: string]: unknown
}
type Row = Payload & { synced_at: string }

// In-memory stand-in for Supabase that mimics the server trigger: it stamps synced_at
// and ignores updates older than the stored row (last write wins).
function createFakeServer() {
  const rows = new Map<string, Row>()
  let clock = 0
  let failUpserts = false
  let onUpsert: (() => Promise<void>) | null = null

  const stamp = () => new Date(Date.UTC(2026, 0, 1) + ++clock * 1000).toISOString()

  const client = {
    from: () => ({
      async upsert(payload: Payload[]) {
        await onUpsert?.()
        if (failUpserts) return { error: { message: 'upsert failed' } }
        for (const incoming of payload) {
          const existing = rows.get(incoming.id)
          if (existing && incoming.updated_at < existing.updated_at) continue
          rows.set(incoming.id, { ...existing, ...incoming, synced_at: stamp() })
        }
        return { error: null }
      },
      select() {
        let after = ''
        let max = Infinity
        const query = {
          gt: (_column: string, value: string) => ((after = value), query),
          order: () => query,
          limit: (n: number) => ((max = n), query),
          then: (resolve: (r: { data: Row[]; error: null }) => unknown) =>
            resolve({
              data: [...rows.values()]
                .filter((r) => r.synced_at > after)
                .sort((a, b) => a.synced_at.localeCompare(b.synced_at))
                .slice(0, max),
              error: null,
            }),
        }
        return query
      },
    }),
  }

  return {
    client: client as unknown as SupabaseClient,
    rows,
    // Simulates another device writing straight to the server
    remoteWrite: (row: Payload) => rows.set(row.id, { ...row, synced_at: stamp() }),
    failUpserts: (fail: boolean) => (failUpserts = fail),
    beforeUpsert: (fn: () => Promise<void>) => (onUpsert = fn),
  }
}

function localExpense(id: string, updatedAt: string, patch: Partial<Expense> = {}): Expense {
  return {
    id,
    amount: 100,
    category: 'other',
    spentAt: updatedAt,
    updatedAt,
    deleted: false,
    pending: 1,
    ...patch,
  }
}

function remoteExpense(id: string, updatedAt: string, amount = 100) {
  return {
    id,
    amount,
    category: 'other',
    spent_at: updatedAt,
    note: null,
    updated_at: updatedAt,
    deleted: false,
  }
}

let server: ReturnType<typeof createFakeServer>

beforeEach(async () => {
  await db.expenses.clear()
  await db.syncState.clear()
  server = createFakeServer()
})

describe('pushTable', () => {
  it('uploads pending rows and clears their pending flag', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))

    await pushTable(server.client, expensesTable)

    expect(server.rows.get('a')).toMatchObject({
      id: 'a',
      amount: 100,
      spent_at: expect.any(String),
    })
    expect((await db.expenses.get('a'))?.pending).toBe(0)
  })

  it('keeps a row pending if it was edited again while uploading', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))
    server.beforeUpsert(async () => {
      await db.expenses.update('a', { amount: 999, updatedAt: '2026-09-01T10:05:00.000Z' })
    })

    await pushTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 999, pending: 1 })
  })

  it('throws and keeps rows pending when the upload fails', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))
    server.failUpserts(true)

    await expect(pushTable(server.client, expensesTable)).rejects.toMatchObject({
      message: 'upsert failed',
    })
    expect((await db.expenses.get('a'))?.pending).toBe(1)
  })
})

describe('pullTable', () => {
  it('downloads remote rows and only fetches newer ones on the next pull', async () => {
    server.remoteWrite(remoteExpense('a', '2026-09-01T10:00:00.000Z', 50))
    await pullTable(server.client, expensesTable)
    expect(await db.expenses.get('a')).toMatchObject({ amount: 50, pending: 0 })

    await db.expenses.update('a', { amount: 1 }) // local-only tweak, to detect a re-download
    server.remoteWrite(remoteExpense('b', '2026-09-02T10:00:00.000Z', 70))
    await pullTable(server.client, expensesTable)

    expect((await db.expenses.get('a'))?.amount).toBe(1) // not fetched again
    expect((await db.expenses.get('b'))?.amount).toBe(70)
  })

  it('does not overwrite a newer local change that is still pending', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T12:00:00.000Z', { amount: 999 }))
    server.remoteWrite(remoteExpense('a', '2026-09-01T10:00:00.000Z', 50))

    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 999, pending: 1 })
  })

  it('takes the remote version when it is newer than a pending local one', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z', { amount: 999 }))
    server.remoteWrite(remoteExpense('a', '2026-09-01T12:00:00.000Z', 50))

    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 50, pending: 0 })
  })

  it('pages through more rows than the page size', async () => {
    for (let i = 0; i < 7; i++) {
      server.remoteWrite(remoteExpense(`r${i}`, `2026-09-0${i + 1}T10:00:00.000Z`))
    }

    await pullTable(server.client, expensesTable, 3)

    expect(await db.expenses.count()).toBe(7)
  })

  it('round-trips: what one device pushes, another pulls', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z', { note: 'feria' }))
    await pushTable(server.client, expensesTable)

    await db.expenses.clear() // "another device" with an empty database
    await db.syncState.clear()
    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ note: 'feria', amount: 100, pending: 0 })
  })
})
