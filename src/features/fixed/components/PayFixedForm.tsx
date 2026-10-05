import { useState, type FormEvent } from 'react'
import { ConversionNote, ManualRateField } from '@/features/expenses'
import { fitsInPesos } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { useConversionRate } from '@/lib/useDollarRate'
import { StickyNote } from 'lucide-react'
import { AmountField, Button, DayField, NoteField, Stack, useToast, VisuallyHidden } from '@/ui'
import { amountToInput, formatCurrencyShort, parseAmount } from '@/utils/currency'
import { nowOnDay, toDayKey } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { fixedRepo } from '../fixedRepo'
import { isShared, myPartOf, shareLabel } from '../fixedShare'
import type { FixedLine } from '../overview'
import styles from './PayFixedForm.module.css'

export interface PayFixedFormProps {
  line: FixedLine
  period: string
  monthName: string
  onDone: () => void
}

// A dollar fixed expense is paid in dollars, converted at today's rate for how it's paid
export function PayFixedForm({ line, period, monthName, onDone }: PayFixedFormProps) {
  const { fixed } = line
  const dollars = fixed.currency === 'USD'
  const [amount, setAmount] = useState(amountToInput(fixed.amount))
  const toast = useToast()
  const [saving, setSaving] = useState(false) // guards against a double tap paying twice
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived
  const [day, setDay] = useState(today) // paid days ago, it's loaded on the day it was
  const [note, setNote] = useState('') // this payment's
  const conversion = useConversionRate({
    enabled: dollars,
    method: fixed.paymentMethod ?? 'cash',
  })
  const parsed = parseAmount(amount)
  const changed = parsed !== null && parsed !== fixed.amount
  // A dollar amount that doesn't fit once in pesos can't be saved (a zero too many)
  const tooBig =
    dollars &&
    parsed !== null &&
    conversion.rate !== null &&
    !fitsInPesos(parsed, conversion.rate.rate)
  // Shared, my part of this bill: an exact part can't be more than what the bill came to
  const shared = isShared(fixed)
  const mine = parsed === null ? null : myPartOf(fixed, parsed)
  const partTooBig = shared && parsed !== null && mine !== null && mine >= parsed
  const isValid =
    parsed !== null &&
    (!dollars || conversion.rate !== null) &&
    !tooBig &&
    !partTooBig &&
    day <= today

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || parsed === null || saving) return
    setSaving(true)
    const paidAt = day === today ? undefined : nowOnDay(day)
    await fixedRepo.pay(fixed, parsed, period, conversion.rate ?? undefined, {
      paidAt,
      note: capitalize(note.trim()) || undefined,
    })
    toast(`Pago de ${fixed.name} registrado`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <p className={styles.hint}>
          <strong>{fixed.name}</strong> de {monthName}
          {fixed.paymentMethod === 'card' && ', con tarjeta'}
        </p>
        {/* The fixed expense's own note: what's needed to pay it */}
        {fixed.note && (
          <p className={styles.fixedNote}>
            <StickyNote aria-hidden />
            <span>
              <VisuallyHidden>Nota de {fixed.name}: </VisuallyHidden>
              {fixed.note}
            </span>
          </p>
        )}
        <div>
          <AmountField
            label={dollars ? `Monto de ${fixed.name} en dólares` : `Monto de ${fixed.name}`}
            symbol={dollars ? 'US$' : '$'}
            value={amount}
            onValueChange={setAmount}
            required
          />
          {dollars && (
            <ConversionNote dollars={parsed} rate={conversion.rate} loading={conversion.loading} />
          )}
          {tooBig && (
            <p className={styles.tooBig} role="alert">
              En pesos es más de lo que se puede cargar. ¿Sobra un cero?
            </p>
          )}
          {shared && mine !== null && parsed !== null && (
            <p className={partTooBig ? styles.tooBig : styles.share} role="status">
              {partTooBig
                ? `Tu parte (${formatCurrencyShort(mine, fixed.currency ?? 'ARS')}) es más que el total: cambiala en el fijo`
                : `${shareLabel(fixed)}: tu parte es ${formatCurrencyShort(mine, fixed.currency ?? 'ARS')}`}
            </p>
          )}
        </div>
        <DayField label="Cuándo lo pagaste" value={day} max={today} onChange={setDay} />
        <NoteField value={note} onChange={setNote} />
        {conversion.needsManual && (
          <ManualRateField value={conversion.manual} onChange={conversion.setManual} />
        )}
        <p className={styles.note} aria-live="polite">
          {changed ? 'Desde el mes que viene te sugerimos este monto.' : ' '}
        </p>
        <Button type="submit" size="lg" fullWidth disabled={!isValid} loading={saving}>
          Registrar pago
        </Button>
      </Stack>
    </form>
  )
}
