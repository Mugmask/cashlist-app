import { db, type Gasto } from './db'
import { supabase } from './supabase'

const CURSOR = 'cursor-gastos'
const PAGINA = 500

interface GastoRow {
  id: string
  monto: number
  categoria: string
  fecha: string
  nota: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

let enCurso: Promise<void> | null = null

// Evita dos sincronizaciones en paralelo: si ya hay una, devuelve esa
export function sincronizar() {
  enCurso ??= subirYBajar().finally(() => {
    enCurso = null
  })
  return enCurso
}

async function subirYBajar() {
  if (!supabase || !navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return

  await subir()
  await bajar()
}

async function subir() {
  const pendientes = await db.gastos.where('pendiente').equals(1).toArray()
  if (pendientes.length === 0) return

  const { error } = await supabase!.from('gastos').upsert(
    pendientes.map((g) => ({
      id: g.id,
      monto: g.monto,
      categoria: g.categoria,
      fecha: g.fecha,
      nota: g.nota ?? null,
      updated_at: g.updatedAt,
      deleted: g.deleted,
    })),
  )
  if (error) throw error

  // Solo se marcan como subidos si no se volvieron a editar mientras se subían
  const enviado = new Map(pendientes.map((g) => [g.id, g.updatedAt]))
  await db.gastos
    .where('id')
    .anyOf([...enviado.keys()])
    .filter((g) => g.updatedAt === enviado.get(g.id))
    .modify({ pendiente: 0 })
}

async function bajar() {
  let cursor = (await db.meta.get(CURSOR))?.valor ?? '1970-01-01T00:00:00Z'

  for (;;) {
    const { data, error } = await supabase!
      .from('gastos')
      .select('id, monto, categoria, fecha, nota, updated_at, deleted, synced_at')
      .gt('synced_at', cursor)
      .order('synced_at')
      .limit(PAGINA)
    if (error) throw error
    const filas = data as GastoRow[]
    if (filas.length === 0) return

    await db.transaction('rw', db.gastos, db.meta, async () => {
      for (const fila of filas) {
        const local = await db.gastos.get(fila.id)
        // Un cambio local sin subir que es más nuevo gana
        if (local?.pendiente && Date.parse(local.updatedAt) > Date.parse(fila.updated_at)) continue
        await db.gastos.put(desdeFila(fila))
      }
      cursor = filas[filas.length - 1].synced_at
      await db.meta.put({ clave: CURSOR, valor: cursor })
    })

    if (filas.length < PAGINA) return
  }
}

function desdeFila(fila: GastoRow): Gasto {
  return {
    id: fila.id,
    monto: Number(fila.monto),
    categoria: fila.categoria,
    fecha: fila.fecha,
    nota: fila.nota ?? undefined,
    updatedAt: fila.updated_at,
    deleted: fila.deleted,
    pendiente: 0,
  }
}
