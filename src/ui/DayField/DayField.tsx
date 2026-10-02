import { CalendarDays } from 'lucide-react'
import { useId } from 'react'
import { formatDayKey, toDayKey } from '@/utils/dates'
import chipStyles from '../ChipGroup/ChipGroup.module.css'
import { cx } from '../cx'
import styles from './DayField.module.css'

export interface DayFieldProps {
  label: string // shown above the chips: "Cuándo fue"
  value: string // local calendar day, "2026-09-28"
  max: string // today, same format: what "Hoy" means, and the latest day allowed
  onChange: (value: string) => void
}

// The day before a "2026-10-02" key, as a key
function dayBefore(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number)
  return toDayKey(new Date(year, month - 1, day - 1))
}

// The day of something, as chips like the rest of the form: "Hoy" and "Ayer" are a tap away,
// since that's most of them, and "Otro día" opens the native date picker (a transparent date
// input covers that chip, so phones show their own calendar). Picked, it shows the day.
export function DayField({ label, value, max, onChange }: DayFieldProps) {
  const id = useId()
  const labelId = useId()
  const today = max
  const yesterday = dayBefore(today)
  const other = value !== today && value !== yesterday
  const otherText = other && value ? formatDayKey(value) : 'Otro día'

  const shortcut = (day: string, text: string) => (
    <button
      type="button"
      className={cx(chipStyles.chip, value === day && chipStyles.checked)}
      aria-pressed={value === day}
      onClick={() => onChange(day)}
    >
      {text}
    </button>
  )

  return (
    <div className={chipStyles.wrapper}>
      <span id={labelId} className={chipStyles.label}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className={chipStyles.group}>
        {shortcut(today, 'Hoy')}
        {shortcut(yesterday, 'Ayer')}
        <span className={styles.other}>
          <label
            htmlFor={id}
            className={cx(chipStyles.chip, other && chipStyles.checked)}
            aria-hidden
          >
            <CalendarDays />
            {otherText}
          </label>
          <input
            id={id}
            type="date"
            className={styles.input}
            aria-label={other ? `Otro día: ${otherText}` : 'Otro día'}
            value={value}
            max={max}
            // Clearing the native field gives "": keep the day it had
            onChange={(e) => e.target.value && onChange(e.target.value)}
            required
          />
        </span>
      </div>
    </div>
  )
}
