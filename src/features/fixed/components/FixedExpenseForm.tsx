import { useState, type FormEvent } from 'react'
import { CURRENCY_OPTIONS, EXPENSE_CATEGORIES, PAYMENT_METHOD_OPTIONS } from '@/features/expenses'
import type { FixedExpense } from '@/lib/db'
import { convertAmount } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { AmountField, Button, ChipGroup, Stack, TextField, useToast } from '@/ui'
import { amountToInput, parseAmount, type Currency } from '@/utils/currency'
import { fixedRepo } from '../fixedRepo'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(({ id, label, icon: Icon }) => ({
  value: id as string,
  label,
  icon: <Icon aria-hidden />,
}))

export interface FixedExpenseFormProps {
  fixed?: FixedExpense // editing when set, creating otherwise
  onDone: () => void
}

export function FixedExpenseForm({ fixed, onDone }: FixedExpenseFormProps) {
  const toast = useToast()
  const [name, setName] = useState(fixed?.name ?? '')
  const [amount, setAmount] = useState(fixed ? amountToInput(fixed.amount) : '')
  const [category, setCategory] = useState(fixed?.category ?? 'rent')
  const [paymentMethod, setPaymentMethod] = useState(fixed?.paymentMethod ?? 'cash')
  const [currency, setCurrency] = useState<Currency>(fixed?.currency ?? 'ARS')

  // Editing, switching currency converts the amount already there (at today's rate)
  async function changeCurrency(next: Currency) {
    setCurrency(next)
    const typed = amount
    const value = parseAmount(typed)
    if (!fixed || value === null) return
    const converted = await convertAmount(value, next, paymentMethod)
    // Unless it was retyped meanwhile
    if (converted) setAmount((current) => (current === typed ? amountToInput(converted) : current))
  }

  const parsedAmount = parseAmount(amount)
  const isValid = name.trim() !== '' && parsedAmount !== null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const input = {
      name: name.trim(),
      category,
      amount: parsedAmount!,
      paymentMethod,
      currency: currency === 'USD' ? ('USD' as const) : undefined,
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
        <AmountField
          label={currency === 'USD' ? 'Monto mensual en dólares' : 'Monto mensual'}
          symbol={currency === 'USD' ? 'US$' : '$'}
          value={amount}
          onValueChange={setAmount}
          required
        />
        <ChipGroup
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={changeCurrency}
        />
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
