import { useState, type FormEvent } from 'react'
import type { Income } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { AmountField, Button, DayField, NoteField, Stack, TextField } from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { nowOnDay, toDayKey, withDayKey } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { incomesRepo } from '../incomesRepo'

export interface IncomeFormProps {
  income?: Income // editing this one; without it, a new one
  onSaved?: () => void
}

// New income, or corrections to one already loaded; the day is today unless picked otherwise,
// like the expense form. The monthly income isn't loaded here: it's in the profile.
export function IncomeForm({ income, onSaved }: IncomeFormProps) {
  const [amount, setAmount] = useState(income ? amountToInput(income.amount) : '')
  const [name, setName] = useState(income?.name ?? '')
  const [note, setNote] = useState(income?.note ?? '')
  const [today] = useState(() => toDayKey(new Date())) // read once: the form is short-lived
  const [day, setDay] = useState(income ? toDayKey(new Date(income.receivedAt)) : today)

  const value = parseAmount(amount)
  const isValid = value !== null && day !== '' && day <= today

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || value === null) return
    const fields = {
      amount: value,
      name: capitalize(name.trim()) || undefined,
      note: capitalize(note.trim()) || undefined,
    }
    if (income) {
      await incomesRepo.update(income.id, {
        ...fields,
        receivedAt: withDayKey(income.receivedAt, day),
      })
    } else {
      await incomesRepo.add({
        ...fields,
        ...(day !== today && { receivedAt: nowOnDay(day) }),
      })
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
        {/* The amount first, like the expense form */}
        <AmountField
          label="Monto"
          value={amount}
          onValueChange={setAmount}
          autoFocus={!income}
          required
        />
        <TextField
          label="De qué es (opcional)"
          hideLabel // the examples say what it is, like the expense form's name
          autoCapitalize="sentences"
          placeholder="Trabajo extra, una venta, un regalo…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <DayField label="Cuándo entró" value={day} max={today} onChange={setDay} />
        <NoteField value={note} onChange={setNote} />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {income ? 'Guardar cambios' : 'Guardar ingreso'}
        </Button>
      </Stack>
    </form>
  )
}
