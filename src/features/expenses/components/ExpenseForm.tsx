import { useState, type FormEvent } from 'react'
import type { Expense } from '@/lib/db'
import { convertAmount, fitsInPesos, toPesos } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { useConversionRate } from '@/lib/useDollarRate'
import { AmountField, Button, ChipGroup, DayField, NoteField, Stack, TextField } from '@/ui'
import {
  amountInputChange,
  amountToInput,
  formatCurrencyShort,
  parseAmount,
  type Currency,
} from '@/utils/currency'
import { nowOnDay, toDayKey, withDayKey } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { BUILT_IN_CATEGORIES, getCategory } from '../categories'
import { INSTALLMENT_OPTIONS, splitInstallments } from '../installments'
import { expensesRepo } from '../expensesRepo'
import { matchSuggestions, type NameSuggestion } from '../suggestions'
import { useNameSuggestions } from '../useNameSuggestions'
import { SHARE_CHIPS, shareOf, shareOptionFor, type ShareOption } from '../shared'
import { PAYMENT_METHOD_OPTIONS } from '../paymentMethods'
import { CategoryIcon } from './CategoryIcon'
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

// An expense as the form loads it, in its own currency: the whole bill, and my part of it
// when shared. A shared dollar expense keeps its bill in pesos: back in dollars at its rate.
function initialAmounts(expense: Expense | undefined) {
  if (!expense) return { total: '', share: '1' as ShareOption, part: '' }
  const dollars = expense.currency === 'USD'
  const mine = dollars ? expense.foreignAmount! : expense.amount
  if (expense.sharedTotal === undefined) {
    return { total: amountToInput(mine), share: '1' as ShareOption, part: '' }
  }
  const total = dollars
    ? Math.round((expense.sharedTotal / expense.exchangeRate!) * 100) / 100
    : expense.sharedTotal
  const share = shareOptionFor(total, mine)
  return {
    total: amountToInput(total),
    share,
    part: share === 'part' ? amountToInput(mine) : '',
  }
}

// New expense, or corrections to one already loaded. The day is today unless picked otherwise.
// In dollars, it's converted to pesos with today's rate for how it was paid. Shared, the
// amount is the whole bill and what's saved is my part of it.
export function ExpenseForm({ expense, defaults, submitLabel, onSaved }: ExpenseFormProps) {
  const wasDollars = expense?.currency === 'USD'
  const [initial] = useState(() => initialAmounts(expense))
  const [currency, setCurrency] = useState<Currency>(wasDollars ? 'USD' : 'ARS')
  const [amount, setAmount] = useState(initial.total)
  const [share, setShare] = useState(initial.share)
  const [part, setPart] = useState(initial.part)
  const [category, setCategory] = useState(
    expense ? getCategory(expense.category).id : (defaults?.category ?? BUILT_IN_CATEGORIES[0].id),
  )
  const [name, setName] = useState(expense?.name ?? defaults?.name ?? '')
  const [note, setNote] = useState(expense?.note ?? defaults?.note ?? '')
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? 'cash')
  const [installments, setInstallments] = useState<(typeof INSTALLMENT_OPTIONS)[number]>(() => {
    const current = String(expense?.installments ?? 1)
    return INSTALLMENT_OPTIONS.find((n) => n === current) ?? '1'
  })
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived
  // A new expense: names used before, picked to fill the form as it was loaded the last time
  const named = useNameSuggestions()
  const suggestions = expense ? [] : matchSuggestions(named, name)

  function pick(s: NameSuggestion) {
    setName(s.name)
    setCategory(getCategory(s.category).id)
    setPaymentMethod(s.paymentMethod)
    // An amount already typed stays, in the currency it was typed in: maybe it cost something
    // else this time. Switching the currency under it would read 15.000 pesos as US$ 15.000.
    if (amount === '') {
      setCurrency(s.currency)
      setAmount(amountToInput(s.amount))
    }
  }
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
  // My part of the bill, in its currency: all of it unless shared
  const shared = share !== '1'
  const mine =
    value === null
      ? null
      : share === '1'
        ? value
        : share === 'part'
          ? parseAmount(part)
          : shareOf(value, Number(share))
  // A part has to be something, and less than the whole bill
  const badPart = shared && value !== null && mine !== null && (mine <= 0 || mine >= value)

  // Editing, switching currency converts the amount already there: at the rate it was loaded
  // with if it was in dollars (back to pesos gives exactly what it cost), else today's
  async function changeCurrency(next: Currency) {
    setCurrency(next)
    const typed = amount
    if (!expense || value === null) return
    const converted = await convertAmount(value, next, paymentMethod, expense.exchangeRate)
    // Unless it was retyped meanwhile
    if (converted) setAmount((current) => (current === typed ? amountToInput(converted) : current))
    // An exact part goes along, at the same rate
    const typedPart = part
    const partValue = share === 'part' ? parseAmount(part) : null
    if (partValue === null) return
    const convertedPart = await convertAmount(partValue, next, paymentMethod, expense.exchangeRate)
    if (convertedPart) {
      setPart((current) => (current === typedPart ? amountToInput(convertedPart) : current))
    }
  }
  // In dollars, an amount that doesn't fit once in pesos can't be saved (a zero too many)
  const tooBig =
    currency === 'USD' && value !== null && rate !== null && !fitsInPesos(value, rate.rate)
  const isValid =
    value !== null &&
    mine !== null &&
    !badPart &&
    (currency === 'ARS' || rate !== null) &&
    !tooBig &&
    day !== '' &&
    day <= today

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || value === null || mine === null) return
    // Not shared, undefined clears the whole bill
    const money =
      currency === 'USD' && rate
        ? {
            amount: toPesos(mine, rate.rate),
            currency: 'USD' as const,
            foreignAmount: mine,
            exchangeRate: rate.rate,
            exchangeRateKind: rate.kind,
            sharedTotal: shared ? toPesos(value, rate.rate) : undefined,
          }
        : { amount: mine, sharedTotal: shared ? value : undefined }
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
      setAmount('')
      setName('')
      setNote('')
      setShare('1')
      setPart('')
    }
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        {/* The amount first: the one thing every expense needs */}
        <div>
          <AmountField
            label={currency === 'USD' ? 'Monto en dólares' : 'Monto'}
            symbol={currency === 'USD' ? 'US$' : '$'}
            value={amount}
            onValueChange={setAmount}
            // The currency rides on the symbol: one tap, $ ⇄ US$
            switchCurrency={{
              label: currency === 'USD' ? 'Cambiar a pesos' : 'Cambiar a dólares',
              onSwitch: () => changeCurrency(currency === 'USD' ? 'ARS' : 'USD'),
            }}
            required
          />
          {currency === 'USD' && (
            <ConversionNote dollars={value} rate={rate} loading={conversion.loading} />
          )}
          {tooBig && (
            <p className={styles.tooBig} role="alert">
              En pesos es más de lo que se puede cargar. ¿Sobra un cero?
            </p>
          )}
        </div>
        {conversion.needsManual && (
          <ManualRateField value={conversion.manual} onChange={conversion.setManual} />
        )}
        {/* What it was, optional: names used before fill the rest in one tap */}
        <TextField
          label="Nombre (opcional)"
          hideLabel // the examples say what it is: one row less
          autoCapitalize="sentences"
          placeholder="Nafta, cine, supermercado…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div className={styles.suggestions} role="group" aria-label="Usados antes">
            {suggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                className={styles.suggestion}
                onClick={() => pick(s)}
                aria-label={`${s.name}, ${formatCurrencyShort(s.amount, s.currency)} la última vez`}
              >
                <CategoryIcon category={s.category} />
                <span className={styles.suggestionName}>{s.name}</span>
                <span className={styles.suggestionAmount}>
                  {formatCurrencyShort(s.amount, s.currency)}
                </span>
              </button>
            ))}
          </div>
        )}
        <CategoryPicker
          value={category}
          onChange={setCategory}
          pickFirst={!expense && !defaults?.category}
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
        <div>
          <ChipGroup
            label="¿Lo compartiste?"
            showLabel
            options={SHARE_CHIPS}
            value={share}
            onChange={setShare}
          />
          {share === 'part' && (
            <TextField
              className={styles.part}
              label={currency === 'USD' ? 'Tu parte, en dólares' : 'Tu parte'}
              hideLabel
              placeholder={currency === 'USD' ? 'Tu parte en US$' : 'Tu parte en $'}
              inputMode="decimal"
              autoComplete="off"
              value={part}
              onChange={(e) => setPart((previous) => amountInputChange(previous, e.target.value))}
            />
          )}
          {shared && value !== null && mine !== null && (
            <p className={badPart ? styles.tooBig : styles.installments} role="status">
              {badPart
                ? 'Tu parte tiene que ser menos que el total'
                : `Tu parte: ${formatCurrencyShort(mine, currency)} de ${formatCurrencyShort(value, currency)}`}
            </p>
          )}
        </div>
        <DayField label="Cuándo fue" value={day} max={today} onChange={setDay} />
        <NoteField value={note} onChange={setNote} />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {submitLabel ?? (expense ? 'Guardar cambios' : 'Guardar gasto')}
        </Button>
      </Stack>
    </form>
  )
}
