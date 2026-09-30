import { useState, type FormEvent } from 'react'
import { agregarGasto, CATEGORIAS } from '../lib/db'
import { sincronizar } from '../lib/sync'

export function NuevoGasto() {
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0])
  const [nota, setNota] = useState('')

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const valor = Number(monto.replace(',', '.'))
    if (!(valor > 0)) return
    await agregarGasto({ monto: valor, categoria, nota: nota.trim() || undefined })
    setMonto('')
    setNota('')
    sincronizar().catch(() => {}) // si falla, queda pendiente y se reintenta solo
  }

  return (
    <form className="card stack" onSubmit={guardar}>
      <input
        className="monto"
        inputMode="decimal"
        placeholder="$ 0"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        aria-label="Monto"
        required
      />
      <div className="chips" role="radiogroup" aria-label="Categoría">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={categoria === c}
            className={categoria === c ? 'chip activo' : 'chip'}
            onClick={() => setCategoria(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <input placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
      <button>Guardar</button>
    </form>
  )
}
