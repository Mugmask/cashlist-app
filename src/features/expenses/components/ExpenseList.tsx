import { runSync } from '@/lib/sync'
import { formatCurrency } from '@/utils/currency'
import { formatShortDay } from '@/utils/dates'
import { getCategoryLabel } from '../categories'
import { expensesRepo } from '../expensesRepo'
import { useMonthExpenses } from '../useMonthExpenses'

export function ExpenseList() {
  const { expenses, total } = useMonthExpenses()

  if (!expenses) return null

  async function handleRemove(id: string) {
    await expensesRepo.remove(id)
    runSync().catch(() => {})
  }

  return (
    <section className="card">
      <div className="total">
        <span>Este mes</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      {expenses.length === 0 ? (
        <p className="muted">Todavía no cargaste gastos este mes.</p>
      ) : (
        <ul className="list">
          {expenses.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{getCategoryLabel(e.category)}</strong>
                <span className="muted">
                  {' · '}
                  {formatShortDay(e.spentAt)}
                  {e.note && ` · ${e.note}`}
                  {e.pending === 1 && ' · sin sincronizar'}
                </span>
              </div>
              <span className="list-amount">{formatCurrency(e.amount)}</span>
              <button
                className="secondary"
                onClick={() => handleRemove(e.id)}
                aria-label="Borrar gasto"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
