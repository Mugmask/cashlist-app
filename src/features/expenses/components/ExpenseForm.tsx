import { useState, type FormEvent } from 'react'
import type { Expense } from '@/lib/db'
import { convertAmount, toPesos } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { useConversionRate } from '@/lib/useDollarRate'
import { AmountField, Button, ChipGroup, Stack, TextField } from '@/ui'
import { amountToInput, formatCurrencyShort, parseAmount, type Currency } from '@/utils/currency'
import { toDayKey, withDayKey } from '@/utils/dates'
import { EXPENSE_CATEGORIES, getCategory, type ExpenseCategoryId } from '../categories'
import { CURRENCY_OPTIONS } from '../currencies'
import { INSTALLMENT_OPTIONS, splitInstallments } from '../installments'
import { expensesRepo } from '../expensesRepo'
import {
  PAYMENT_METHOD_OPTIONS,
  readLastPaymentMethod,
  rememberPaymentMethod,
} from '../paymentMethods'
import { ConversionNote, ManualRateField } from './DollarConversion'
import styles from './ExpenseForm.module.css'

const INSTALLMENT_CHIPS = INSTALLMENT_OPTIONS.map((n) => ({
  value: n,
  label: n === '1' ? 'Sin cuotas' : n,
}))

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map(({ id, label, icon: Icon }) => ({
  value: id,
  label,
  icon: <Icon aria-hidden />,
}))

export interface ExpenseFormProps {
  // Editing this expense; without it, a new one
  expense?: Expense
  onSaved?: () => void
}

// New expense, or corrections to one already loaded (then the day can change too).
// In dollars, it's converted to pesos with today's rate for how it was paid.
export function ExpenseForm({ expense, onSaved }: ExpenseFormProps) {
  const wasDollars = expense?.currency === 'USD'
  const [currency, setCurrency] = useState<Currency>(wasDollars ? 'USD' : 'ARS')
  const [amount, setAmount] = useState(
    expense ? amountToInput(wasDollars ? expense.foreignAmount! : expense.amount) : '',
  )
  const [category, setCategory] = useState<ExpenseCategoryId>(
    expense ? getCategory(expense.category).id : EXPENSE_CATEGORIES[0].id,
  )
  const [note, setNote] = useState(expense?.note ?? '')
  const [paymentMethod, setPaymentMethod] = useState(
    expense ? (expense.paymentMethod ?? 'cash') : readLastPaymentMethod,
  )
  const [installments, setInstallments] = useState<(typeof INSTALLMENT_OPTIONS)[number]>(() => {
    const current = String(expense?.installments ?? 1)
    return INSTALLMENT_OPTIONS.find((n) => n === current) ?? '1'
  })
  const [day, setDay] = useState(expense ? toDayKey(new Date(expense.spentAt)) : '')
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived

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
    value !== null &&
    (currency === 'ARS' || rate !== null) &&
    (!expense || (day !== '' && day <= today))

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
      note: note.trim() || undefined,
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
      await expensesRepo.add(fields)
      rememberPaymentMethod(paymentMethod)
      setAmount('')
      setNote('')
    }
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
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
        <ChipGroup
          label="Categoría"
          showLabel
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
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
        {expense && (
          <TextField
            label="Día"
            type="date"
            value={day}
            max={today}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        )}
        <TextField
          label="Nota"
          hideLabel
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {expense ? 'Guardar cambios' : 'Guardar gasto'}
        </Button>
      </Stack>
    </form>
  )
}
