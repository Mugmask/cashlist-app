import { useState, type FormEvent } from 'react'
import type { Income } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { AmountField, Button, Stack, TextField } from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { toDayKey, withDayKey } from '@/utils/dates'
import { incomesRepo } from '../incomesRepo'

export interface IncomeFormProps {
  income?: Income // editing this one; without it, a new one
  onSaved?: () => void
}

// New income, or corrections to one already loaded (then the day can change too), like the
// expense form. The monthly income isn't loaded here: it's in the profile.
export function IncomeForm({ income, onSaved }: IncomeFormProps) {
  const [amount, setAmount] = useState(income ? amountToInput(income.amount) : '')
  const [name, setName] = useState(income?.name ?? '')
  const [note, setNote] = useState(income?.note ?? '')
  const [day, setDay] = useState(income ? toDayKey(new Date(income.receivedAt)) : '')
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived

  const value = parseAmount(amount)
  const isValid = value !== null && (!income || (day !== '' && day <= today))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || value === null) return
    const fields = {
      amount: value,
      name: name.trim() || undefined,
      note: note.trim() || undefined,
    }
    if (income) {
      await incomesRepo.update(income.id, {
        ...fields,
        receivedAt: withDayKey(income.receivedAt, day),
      })
    } else {
      await incomesRepo.add(fields)
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
        <TextField
          label="De qué es (opcional)"
          placeholder="Martina, venta de la bici, un trabajo…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <AmountField
          label="Monto"
          value={amount}
          onValueChange={setAmount}
          autoFocus={!income}
          required
        />
        {income && (
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
          {income ? 'Guardar cambios' : 'Guardar ingreso'}
        </Button>
      </Stack>
    </form>
  )
}
