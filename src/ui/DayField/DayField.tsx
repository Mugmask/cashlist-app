import { CalendarDays } from 'lucide-react'
import { useId } from 'react'
import { formatDayKey } from '@/utils/dates'
import styles from './DayField.module.css'

export interface DayFieldProps {
  label: string // for screen readers: "Día del gasto"
  value: string // local calendar day, "2026-09-28"
  max?: string // the latest day allowed, same format
  onChange: (value: string) => void
}

// The day of something, as a small chip that reads "Hoy", "Ayer" or "Lunes, 28 sept". Most
// things happen today, so it stays out of the way; tapping it opens the native date picker
// (a transparent date input covers the chip, so phones show their own calendar).
export function DayField({ label, value, max, onChange }: DayFieldProps) {
  const id = useId()
  const text = value ? formatDayKey(value) : 'Elegí un día'

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.chip}>
        <CalendarDays aria-hidden />
        <span aria-hidden>{text}</span>
      </label>
      <input
        id={id}
        type="date"
        className={styles.input}
        aria-label={`${label}: ${text}`}
        value={value}
        max={max}
        // Clearing the native field gives "": keep the day it had
        onChange={(e) => e.target.value && onChange(e.target.value)}
        required
      />
    </div>
  )
}
