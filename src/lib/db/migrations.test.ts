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

    expect(db.verno).toBe(7)
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'budgets',
      'expenses',
      'fixedExpenses',
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

  it('v6 → v7 turns shopping history into one in-stock product per name', async () => {
    db.close()
    await Dexie.delete('cashlist')

    const v6 = new Dexie('cashlist')
    v6.version(6).stores({
      expenses: 'id, category, spentAt, updatedAt, pending',
      budgets: 'id, pending',
      shoppingItems: 'id, status, pending',
      syncState: 'key',
    })
    const at = (day: number) => `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`
    const base = { quantity: 1, deleted: false, pending: 0 }
    await v6.table('shoppingItems').bulkAdd([
      {
        ...base,
        id: 'leche-1',
        name: 'Leche',
        status: 'bought',
        boughtAt: at(1),
        updatedAt: at(1),
      },
      {
        ...base,
        id: 'leche-2',
        name: 'leche',
        status: 'bought',
        boughtAt: at(8),
        updatedAt: at(8),
      },
      { ...base, id: 'pan-1', name: 'Pan', status: 'bought', boughtAt: at(2), updatedAt: at(2) },
      { ...base, id: 'pan-2', name: 'Pan', status: 'to_buy', quantity: 2, updatedAt: at(9) },
      { ...base, id: 'yerba', name: 'Yerba', status: 'in_cart', updatedAt: at(9) },
    ])
    await v6.table('syncState').put({ key: 'shopping_items-cursor', value: at(9) })
    v6.close()

    await db.open()

    const active = (await db.shoppingItems.toArray()).filter((i) => !i.deleted)
    expect(active.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      // most recent history row kept, counting both purchases
      expect.objectContaining({
        id: 'leche-2',
        status: 'in_stock',
        lastBoughtAt: at(8),
        timesBought: 2,
      }),
      // the one on the list wins over its history, keeping the quantity
      expect.objectContaining({ id: 'pan-2', status: 'to_buy', quantity: 2, timesBought: 1 }),
      expect.objectContaining({ id: 'yerba', status: 'in_cart', timesBought: 0 }),
    ])
    // duplicates are soft-deleted and everything re-uploads with the new schema
    expect((await db.shoppingItems.get('leche-1'))?.deleted).toBe(true)
    expect(await db.shoppingItems.where('pending').equals(1).count()).toBe(5)
    expect(await db.syncState.get('shopping_items-cursor')).toBeUndefined()
  })
})
