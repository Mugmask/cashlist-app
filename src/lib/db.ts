import Dexie, { type EntityTable } from 'dexie'

export interface Gasto {
  id: string // crypto.randomUUID(), generado en el cliente
  monto: number
  categoria: string
  fecha: string // ISO
  nota?: string
  updatedAt: string // ISO, para la sincronización (gana el último)
  deleted: boolean // borrado lógico, así el borrado también se sincroniza
  pendiente: 0 | 1 // 1 = cambio local que falta subir (número porque IndexedDB no indexa booleans)
}

interface Meta {
  clave: string
  valor: string
}

export const db = new Dexie('cashlist') as Dexie & {
  gastos: EntityTable<Gasto, 'id'>
  meta: EntityTable<Meta, 'clave'>
}

db.version(1).stores({
  gastos: 'id, categoria, fecha, updatedAt',
})

db.version(2).stores({
  gastos: 'id, categoria, fecha, updatedAt, pendiente',
  meta: 'clave',
})

export const CATEGORIAS = [
  'Súper',
  'Delivery',
  'Alquiler',
  'Servicios',
  'Transporte',
  'Salidas',
  'Salud',
  'Otros',
] as const

export async function agregarGasto(datos: Pick<Gasto, 'monto' | 'categoria' | 'nota'>) {
  const ahora = new Date().toISOString()
  await db.gastos.add({
    ...datos,
    id: crypto.randomUUID(),
    fecha: ahora,
    updatedAt: ahora,
    deleted: false,
    pendiente: 1,
  })
}

export async function borrarGasto(id: string) {
  await db.gastos.update(id, {
    deleted: true,
    updatedAt: new Date().toISOString(),
    pendiente: 1,
  })
}

// Pide al navegador que no borre IndexedDB por falta de espacio
export async function pedirAlmacenamientoPersistente() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
