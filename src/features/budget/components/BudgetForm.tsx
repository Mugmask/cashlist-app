import { useState, type FormEvent } from 'react'
import { getCategory } from '@/features/expenses'
import { runSync } from '@/lib/sync'
import { AmountField, Button, Stack } from '@/ui'
import { formatCurrencyShort, parseAmount } from '@/utils/currency'
import { budgetsRepo } from '../budgetsRepo'
import styles from './BudgetForm.module.css'

export interface BudgetFormProps {
  category: string
  currentLimit?: number
  spent: number
  onDone: () => void
}

export function BudgetForm({ category, currentLimit, spent, onDone }: BudgetFormProps) {
  const [amount, setAmount] = useState(currentLimit ? String(currentLimit) : '')
  const isValid = parseAmount(amount) !== null
  const { label } = getCategory(category)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseAmount(amount)
    if (value === null) return
    await budgetsRepo.set(category, value)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  async function handleRemove() {
    await budgetsRepo.remove(category)
    runSync().catch(() => {})
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <p className={styles.hint}>
          Tope mensual para <strong>{label}</strong>. Se repite todos los meses hasta que lo
          cambies.
        </p>
        <AmountField
          label={`Presupuesto para ${label}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          required
        />
        <p className={styles.spent}>
          {spent > 0
            ? `Este mes llevás ${formatCurrencyShort(spent)}`
            : 'Este mes todavía no gastaste'}
        </p>
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          Guardar
        </Button>
        {currentLimit !== undefined && (
          <Button variant="danger" size="lg" fullWidth onClick={handleRemove}>
            Quitar presupuesto
          </Button>
        )}
      </Stack>
    </form>
  )
}
