import { useState, type FormEvent } from 'react'
import { EXPENSE_CATEGORIES, PAYMENT_METHOD_OPTIONS } from '@/features/expenses'
import type { FixedExpense } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { AmountField, Button, ChipGroup, Stack, TextField, useToast } from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { fixedRepo } from '../fixedRepo'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(({ id, label, icon: Icon }) => ({
  value: id as string,
  label,
  icon: <Icon aria-hidden />,
}))

// Empty is fine (no due day); otherwise a whole day of the month
function parseDueDay(text: string): number | undefined | null {
  if (!text.trim()) return undefined
  const day = Number(text)
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null
}

export interface FixedExpenseFormProps {
  fixed?: FixedExpense // editing when set, creating otherwise
  onDone: () => void
}

export function FixedExpenseForm({ fixed, onDone }: FixedExpenseFormProps) {
  const toast = useToast()
  const [name, setName] = useState(fixed?.name ?? '')
  const [amount, setAmount] = useState(fixed ? amountToInput(fixed.amount) : '')
  const [category, setCategory] = useState(fixed?.category ?? 'rent')
  const [dueDay, setDueDay] = useState(fixed?.dueDay ? String(fixed.dueDay) : '')
  const [paymentMethod, setPaymentMethod] = useState(fixed?.paymentMethod ?? 'cash')

  const parsedAmount = parseAmount(amount)
  const parsedDueDay = parseDueDay(dueDay)
  const isValid = name.trim() !== '' && parsedAmount !== null && parsedDueDay !== null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const input = {
      name: name.trim(),
      category,
      amount: parsedAmount!,
      dueDay: parsedDueDay ?? undefined,
      paymentMethod,
    }
    if (fixed) await fixedRepo.update(fixed.id, input)
    else await fixedRepo.create(input)
    toast(fixed ? 'Cambios guardados' : `${input.name} agregado a tus fijos`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  async function handleDelete() {
    if (!fixed) return
    await fixedRepo.remove(fixed.id)
    toast(`${fixed.name} eliminado`)
    runSync().catch(() => {})
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <TextField
          label="Nombre"
          placeholder="Alquiler, expensas, internet…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!fixed}
          required
        />
        <AmountField label="Monto mensual" value={amount} onValueChange={setAmount} required />
        <ChipGroup
          label="Categoría"
          showLabel
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <ChipGroup
          label="Cómo lo pagás"
          showLabel
          options={PAYMENT_METHOD_OPTIONS}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
        <TextField
          label="Día de vencimiento (opcional)"
          placeholder="Ej: 10"
          inputMode="numeric"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          error={parsedDueDay === null ? 'Tiene que ser un día del 1 al 31' : null}
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {fixed ? 'Guardar cambios' : 'Agregar gasto fijo'}
        </Button>
        {fixed && (
          <Button variant="danger" size="lg" fullWidth onClick={handleDelete}>
            Eliminar gasto fijo
          </Button>
        )}
      </Stack>
    </form>
  )
}
