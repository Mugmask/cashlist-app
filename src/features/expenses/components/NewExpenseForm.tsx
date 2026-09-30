import { useState, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import { parseAmount } from '@/utils/currency'
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '../categories'
import { expensesRepo } from '../expensesRepo'

export function NewExpenseForm() {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategoryId>(EXPENSE_CATEGORIES[0].id)
  const [note, setNote] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseAmount(amount)
    if (value === null) return
    await expensesRepo.add({ amount: value, category, note: note.trim() || undefined })
    setAmount('')
    setNote('')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <input
        className="amount-input"
        inputMode="decimal"
        placeholder="$ 0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Monto"
        required
      />
      <div className="chips" role="radiogroup" aria-label="Categoría">
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={category === c.id}
            className={category === c.id ? 'chip active' : 'chip'}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button>Guardar</button>
    </form>
  )
}
