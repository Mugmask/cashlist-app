import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from './index'

afterEach(async () => {
  db.close()
  await Dexie.delete('cashlist')
})

describe('db migrations', () => {
  it('v2 → latest moves Spanish-schema rows to expenses without losing data', async () => {
    db.close()
    await Dexie.delete('cashlist')

    // Recreate the database exactly as the v2 app left it
    const legacy = new Dexie('cashlist')
    legacy.version(2).stores({
      gastos: 'id, categoria, fecha, updatedAt, pendiente',
      meta: 'clave',
    })
    await legacy.table('gastos').bulkAdd([
      {
        id: 'a',
        monto: 1500,
        categoria: 'Súper',
        fecha: '2026-09-10T10:00:00.000Z',
        nota: 'feria',
        updatedAt: '2026-09-10T10:00:00.000Z',
        deleted: false,
        pendiente: 1,
      },
      {
        id: 'b',
        monto: 900,
        categoria: 'Salidas',
        fecha: '2026-09-11T10:00:00.000Z',
        updatedAt: '2026-09-12T10:00:00.000Z',
        deleted: true,
        pendiente: 0,
      },
      {
        id: 'c',
        monto: 50,
        categoria: 'Algo raro',
        fecha: '2026-09-12T10:00:00.000Z',
        updatedAt: '2026-09-12T10:00:00.000Z',
        deleted: false,
        pendiente: 0,
      },
    ])
    await legacy.table('meta').put({ clave: 'cursor-gastos', valor: '2026-09-12T10:00:00Z' })
    legacy.close()

    await db.open()

    expect(db.verno).toBe(6)
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'budgets',
      'expenses',
      'shoppingItems',
      'syncState',
    ])
    expect(await db.expenses.orderBy('id').toArray()).toEqual([
      {
        id: 'a',
        amount: 1500,
        category: 'groceries',
        spentAt: '2026-09-10T10:00:00.000Z',
        note: 'feria',
        updatedAt: '2026-09-10T10:00:00.000Z',
        deleted: false,
        pending: 1,
      },
      {
        id: 'b',
        amount: 900,
        category: 'going_out',
        spentAt: '2026-09-11T10:00:00.000Z',
        note: undefined,
        updatedAt: '2026-09-12T10:00:00.000Z',
        deleted: true,
        pending: 0,
      },
      {
        id: 'c',
        amount: 50,
        category: 'other',
        spentAt: '2026-09-12T10:00:00.000Z',
        note: undefined,
        updatedAt: '2026-09-12T10:00:00.000Z',
        deleted: false,
        pending: 0,
      },
    ])
    // Cursor starts empty so the next sync does a full pull of the renamed table
    expect(await db.syncState.count()).toBe(0)
  })
})
