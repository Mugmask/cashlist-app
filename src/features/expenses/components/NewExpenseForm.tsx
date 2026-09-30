import { useState, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import { AmountField, Button, ChipGroup, Stack, TextField } from '@/ui'
import { parseAmount } from '@/utils/currency'
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '../categories'
import { expensesRepo } from '../expensesRepo'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(({ id, label, icon: Icon }) => ({
  value: id,
  label,
  icon: <Icon aria-hidden />,
}))

export interface NewExpenseFormProps {
  onSaved?: () => void
}

export function NewExpenseForm({ onSaved }: NewExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategoryId>(EXPENSE_CATEGORIES[0].id)
  const [note, setNote] = useState('')
  const isValid = parseAmount(amount) !== null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseAmount(amount)
    if (value === null) return
    await expensesRepo.add({ amount: value, category, note: note.trim() || undefined })
    setAmount('')
    setNote('')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <AmountField label="Monto" value={amount} onValueChange={setAmount} autoFocus required />
        <ChipGroup
          label="Categoría"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <TextField
          label="Nota"
          hideLabel
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          Guardar gasto
        </Button>
      </Stack>
    </form>
  )
}
