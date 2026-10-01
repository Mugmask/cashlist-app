import { useState, type FormEvent } from 'react'
import type { Expense } from '@/lib/db'
import { convertAmount, toPesos } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { useConversionRate } from '@/lib/useDollarRate'
import { AmountField, Button, ChipGroup, DayField, Stack, TextField } from '@/ui'
import { amountToInput, formatCurrencyShort, parseAmount, type Currency } from '@/utils/currency'
import { nowOnDay, toDayKey, withDayKey } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { BUILT_IN_CATEGORIES, getCategory } from '../categories'
import { CURRENCY_OPTIONS } from '../currencies'
import { INSTALLMENT_OPTIONS, splitInstallments } from '../installments'
import { expensesRepo } from '../expensesRepo'
import {
  PAYMENT_METHOD_OPTIONS,
  readLastPaymentMethod,
  rememberPaymentMethod,
} from '../paymentMethods'
import { CategoryPicker } from './CategoryPicker'
import { ConversionNote, ManualRateField } from './DollarConversion'
import styles from './ExpenseForm.module.css'

const INSTALLMENT_CHIPS = INSTALLMENT_OPTIONS.map((n) => ({
  value: n,
  label: n === '1' ? 'Sin cuotas' : n,
}))

export interface ExpenseFormProps {
  // Editing this expense; without it, a new one
  expense?: Expense
  // A new one already filled in: a finished purchase is Súper, with its products as the note
  defaults?: { category?: string; name?: string; note?: string }
  submitLabel?: string
  onSaved?: () => void
}

// New expense, or corrections to one already loaded. The day is today unless picked otherwise.
// In dollars, it's converted to pesos with today's rate for how it was paid.
export function ExpenseForm({ expense, defaults, submitLabel, onSaved }: ExpenseFormProps) {
  const wasDollars = expense?.currency === 'USD'
  const [currency, setCurrency] = useState<Currency>(wasDollars ? 'USD' : 'ARS')
  const [amount, setAmount] = useState(
    expense ? amountToInput(wasDollars ? expense.foreignAmount! : expense.amount) : '',
  )
  const [category, setCategory] = useState(
    expense ? getCategory(expense.category).id : (defaults?.category ?? BUILT_IN_CATEGORIES[0].id),
  )
  const [name, setName] = useState(expense?.name ?? defaults?.name ?? '')
  const [note, setNote] = useState(expense?.note ?? defaults?.note ?? '')
  const [paymentMethod, setPaymentMethod] = useState(
    expense ? (expense.paymentMethod ?? 'cash') : readLastPaymentMethod,
  )
  const [installments, setInstallments] = useState<(typeof INSTALLMENT_OPTIONS)[number]>(() => {
    const current = String(expense?.installments ?? 1)
    return INSTALLMENT_OPTIONS.find((n) => n === current) ?? '1'
  })
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived
  const [day, setDay] = useState(expense ? toDayKey(new Date(expense.spentAt)) : today)

  // An edited dollar expense keeps the rate it was loaded with, unless how it was paid changes
  const keepsRate =
    wasDollars && currency === 'USD' && paymentMethod === (expense.paymentMethod ?? 'cash')
  const conversion = useConversionRate({
    enabled: currency === 'USD',
    method: paymentMethod,
    kept: keepsRate ? { kind: expense.exchangeRateKind!, rate: expense.exchangeRate! } : null,
  })
  const { rate } = conversion

  const value = parseAmount(amount)
  const inInstallments = paymentMethod === 'card' && installments !== '1'
  // What each installment comes to, in pesos (what the statements charge)
  const pesos =
    value === null ? null : currency === 'USD' ? (rate ? toPesos(value, rate.rate) : null) : value
  const installment =
    inInstallments && pesos !== null ? splitInstallments(pesos, Number(installments))[0] : null

  // Editing, switching currency converts the amount already there: at the rate it was loaded
  // with if it was in dollars (back to pesos gives exactly what it cost), else today's
  async function changeCurrency(next: Currency) {
    setCurrency(next)
    const typed = amount
    if (!expense || value === null) return
    const converted = await convertAmount(value, next, paymentMethod, expense.exchangeRate)
    // Unless it was retyped meanwhile
    if (converted) setAmount((current) => (current === typed ? amountToInput(converted) : current))
  }
  const isValid =
    value !== null && (currency === 'ARS' || rate !== null) && day !== '' && day <= today

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || value === null) return
    const money =
      currency === 'USD' && rate
        ? {
            amount: toPesos(value, rate.rate),
            currency: 'USD' as const,
            foreignAmount: value,
            exchangeRate: rate.rate,
            exchangeRateKind: rate.kind,
          }
        : { amount: value }
    const fields = {
      ...money,
      category,
      paymentMethod,
      // Only card purchases go in installments; undefined clears them
      installments: inInstallments ? Number(installments) : undefined,
      name: capitalize(name.trim()) || undefined,
      note: capitalize(note.trim()) || undefined,
    }
    if (expense) {
      await expensesRepo.update(expense.id, {
        // Back in pesos, the dollar fields go (undefined clears them)
        currency: undefined,
        foreignAmount: undefined,
        exchangeRate: undefined,
        exchangeRateKind: undefined,
        ...fields,
        spentAt: withDayKey(expense.spentAt, day),
      })
    } else {
      // Another day keeps the time it's loaded at, like moving an expense to another day
      await expensesRepo.add({
        ...fields,
        ...(day !== today && { spentAt: nowOnDay(day) }),
      })
      rememberPaymentMethod(paymentMethod)
      setAmount('')
      setName('')
      setNote('')
    }
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        {/* Like the fixed expenses' form: the name on top, here optional */}
        <TextField
          label="Nombre (opcional)"
          autoCapitalize="sentences"
          placeholder="Nafta, cine, supermercado…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <div>
          <AmountField
            label={currency === 'USD' ? 'Monto en dólares' : 'Monto'}
            symbol={currency === 'USD' ? 'US$' : '$'}
            value={amount}
            onValueChange={setAmount}
            autoFocus={!expense}
            required
          />
          {currency === 'USD' && (
            <ConversionNote dollars={value} rate={rate} loading={conversion.loading} />
          )}
        </div>
        <ChipGroup
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={changeCurrency}
        />
        {conversion.needsManual && (
          <ManualRateField value={conversion.manual} onChange={conversion.setManual} />
        )}
        <CategoryPicker value={category} onChange={setCategory} />
        <ChipGroup
          label="Cómo lo pagaste"
          showLabel
          options={PAYMENT_METHOD_OPTIONS}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
        {paymentMethod === 'card' && (
          <div>
            <ChipGroup
              label="Cuotas"
              showLabel
              options={INSTALLMENT_CHIPS}
              value={installments}
              onChange={setInstallments}
            />
            {installment !== null && (
              <p className={styles.installments}>
                {installments} cuotas de {formatCurrencyShort(installment)}
              </p>
            )}
          </div>
        )}
        <DayField label="Día del gasto" value={day} max={today} onChange={setDay} />
        <TextField
          label="Nota"
          autoCapitalize="sentences"
          hideLabel
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {submitLabel ?? (expense ? 'Guardar cambios' : 'Guardar gasto')}
        </Button>
      </Stack>
    </form>
  )
}
