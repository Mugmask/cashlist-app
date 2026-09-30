import { useLiveQuery } from 'dexie-react-hooks'
import { borrarGasto, db } from '../lib/db'
import { sincronizar } from '../lib/sync'

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const dia = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

function inicioDelMes() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function ListaGastos() {
  const desde = inicioDelMes()

  const gastos = useLiveQuery(
    () =>
      db.gastos
        .where('fecha')
        .aboveOrEqual(desde)
        .reverse()
        .filter((g) => !g.deleted)
        .toArray(),
    [desde],
  )

  if (!gastos) return null

  const total = gastos.reduce((suma, g) => suma + g.monto, 0)

  async function borrar(id: string) {
    await borrarGasto(id)
    sincronizar().catch(() => {})
  }

  return (
    <section className="card">
      <div className="total">
        <span>Este mes</span>
        <strong>{pesos.format(total)}</strong>
      </div>
      {gastos.length === 0 ? (
        <p className="muted">Todavía no cargaste gastos este mes.</p>
      ) : (
        <ul className="lista">
          {gastos.map((g) => (
            <li key={g.id}>
              <div>
                <strong>{g.categoria}</strong>
                <span className="muted">
                  {' · '}
                  {dia.format(new Date(g.fecha))}
                  {g.nota && ` · ${g.nota}`}
                  {g.pendiente === 1 && ' · sin sincronizar'}
                </span>
              </div>
              <span className="lista-monto">{pesos.format(g.monto)}</span>
              <button className="secondary" onClick={() => borrar(g.id)} aria-label="Borrar gasto">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
