import { useState, type FormEvent } from 'react'
import { CategoryPicker, CURRENCY_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/features/expenses'
import type { FixedExpense } from '@/lib/db'
import { convertAmount } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { AmountField, Button, ChipGroup, Stack, TextField, useToast } from '@/ui'
import { amountToInput, parseAmount, type Currency } from '@/utils/currency'
import { capitalize } from '@/utils/text'
import { fixedRepo } from '../fixedRepo'
import { FixedHistory } from './FixedHistory'

// Empty is fine (no due day); otherwise a whole day of the month. Null when it isn't one.
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
  const [paymentMethod, setPaymentMethod] = useState(fixed?.paymentMethod ?? 'cash')
  const [currency, setCurrency] = useState<Currency>(fixed?.currency ?? 'ARS')
  const [dueDay, setDueDay] = useState(fixed?.dueDay ? String(fixed.dueDay) : '')

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
  const parsedDueDay = parseDueDay(dueDay)
  const isValid = name.trim() !== '' && parsedAmount !== null && parsedDueDay !== null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const input = {
      name: capitalize(name.trim()),
      category,
      amount: parsedAmount!,
      paymentMethod,
      currency: currency === 'USD' ? ('USD' as const) : undefined,
      dueDay: parsedDueDay ?? undefined,
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
          autoCapitalize="sentences"
          placeholder="Alquiler, expensas, internet…"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <CategoryPicker value={category} onChange={setCategory} pickFirst={!fixed} />
        <ChipGroup
          label="Cómo lo pagás"
          showLabel
          options={PAYMENT_METHOD_OPTIONS}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
        <TextField
          label="Día de vencimiento (opcional)"
          hint="Te avisamos cuando se acerca y si se pasa"
          placeholder="Ej: 10"
          inputMode="numeric"
          autoComplete="off"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
          error={parsedDueDay === null ? 'Tiene que ser un día del 1 al 31' : null}
        />
        {fixed && <FixedHistory fixedExpenseId={fixed.id} />}
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
