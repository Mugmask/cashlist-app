import Dexie, { type EntityTable } from 'dexie'

// Fields every record synced with Supabase needs
export interface Syncable {
  id: string // crypto.randomUUID(), generated on the client
  updatedAt: string // ISO, decides which version wins a conflict (last write wins)
  deleted: boolean // soft delete, so deletions sync too
  pending: 0 | 1 // 1 = local change not uploaded yet (a number because IndexedDB can't index booleans)
}

export interface Expense extends Syncable {
  amount: number
  category: string
  spentAt: string // ISO
  note?: string
}

interface SyncState {
  key: string
  value: string
}

export const db = new Dexie('cashlist') as Dexie & {
  expenses: EntityTable<Expense, 'id'>
  syncState: EntityTable<SyncState, 'key'>
}

db.version(1).stores({
  gastos: 'id, categoria, fecha, updatedAt',
})

db.version(2).stores({
  gastos: 'id, categoria, fecha, updatedAt, pendiente',
  meta: 'clave',
})

// v3: Spanish schema → English schema. Copies the legacy rows; v4 drops the old tables.
// The sync cursor is not copied on purpose: the next sync does a full pull of the renamed table.
const LEGACY_CATEGORIES: Record<string, string> = {
  Súper: 'groceries',
  Delivery: 'delivery',
  Alquiler: 'rent',
  Servicios: 'utilities',
  Transporte: 'transport',
  Salidas: 'going_out',
  Salud: 'health',
  Otros: 'other',
}

interface LegacyGasto {
  id: string
  monto: number
  categoria: string
  fecha: string
  nota?: string
  updatedAt: string
  deleted: boolean
  pendiente: 0 | 1
}

db.version(3)
  .stores({
    expenses: 'id, category, spentAt, updatedAt, pending',
    syncState: 'key',
  })
  .upgrade(async (tx) => {
    const legacy: LegacyGasto[] = await tx.table('gastos').toArray()
    await tx.table('expenses').bulkPut(
      legacy.map((g): Expense => ({
        id: g.id,
        amount: g.monto,
        category: LEGACY_CATEGORIES[g.categoria] ?? 'other',
        spentAt: g.fecha,
        note: g.nota,
        updatedAt: g.updatedAt,
        deleted: g.deleted,
        pending: g.pendiente,
      })),
    )
  })

db.version(4).stores({
  gastos: null,
  meta: null,
})

// Asks the browser not to evict IndexedDB when storage runs low
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
