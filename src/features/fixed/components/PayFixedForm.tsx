import { useState, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import { AmountField, Button, Stack, useToast } from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { fixedRepo } from '../fixedRepo'
import type { FixedLine } from '../overview'
import styles from './PayFixedForm.module.css'

export interface PayFixedFormProps {
  line: FixedLine
  period: string
  monthName: string
  onDone: () => void
}

export function PayFixedForm({ line, period, monthName, onDone }: PayFixedFormProps) {
  const { fixed } = line
  const [amount, setAmount] = useState(amountToInput(fixed.amount))
  const toast = useToast()
  const [saving, setSaving] = useState(false) // guards against a double tap paying twice
  const parsed = parseAmount(amount)
  const changed = parsed !== null && parsed !== fixed.amount

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (parsed === null || saving) return
    setSaving(true)
    await fixedRepo.pay(fixed, parsed, period)
    toast(`Pago de ${fixed.name} registrado`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <p className={styles.hint}>
          Pago de <strong>{fixed.name}</strong> de {monthName}. Si aumentó, cambiá el monto.
        </p>
        <AmountField
          label={`Monto de ${fixed.name}`}
          value={amount}
          onValueChange={setAmount}
          autoFocus
          required
        />
        <p className={styles.note} aria-live="polite">
          {changed ? 'Desde el mes que viene te sugerimos este monto.' : ' '}
        </p>
        <Button type="submit" size="lg" fullWidth disabled={parsed === null} loading={saving}>
          Registrar pago
        </Button>
      </Stack>
    </form>
  )
}
