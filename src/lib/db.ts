import Dexie, { type EntityTable } from 'dexie'

export interface Gasto {
  id: string // crypto.randomUUID(), generado en el cliente
  monto: number
  categoria: string
  fecha: string // ISO
  nota?: string
  updatedAt: string // ISO, para la sincronización (gana el último)
  deleted: boolean // borrado lógico, así el borrado también se sincroniza
}

export const db = new Dexie('cashlist') as Dexie & {
  gastos: EntityTable<Gasto, 'id'>
}

db.version(1).stores({
  gastos: 'id, categoria, fecha, updatedAt',
})

// Pide al navegador que no borre IndexedDB por falta de espacio
export async function pedirAlmacenamientoPersistente() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
