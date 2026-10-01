import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/ui'
import { formatMonthName, formatShortMonth, shiftMonth } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { useMonth } from './month'
import styles from './MonthSwitcher.module.css'

// ‹ Septiembre › in the header: moves every screen to another month. Another year's months show
// short with the year ("Dic 2025"); tapping the month (when looking at another) comes back to
// this month. On this month the › keeps its room, so the name never shifts.
export function MonthSwitcher() {
  const { month, current, isCurrent, select } = useMonth()
  const name = (date: Date) =>
    date.getFullYear() === current.getFullYear()
      ? capitalize(formatMonthName(date))
      : formatShortMonth(date, current.getFullYear())
  const previous = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)

  return (
    <div className={styles.switcher}>
      <IconButton
        label={`Ver ${name(previous).toLowerCase()}`}
        icon={<ChevronLeft />}
        onClick={() => select(previous)}
      />
      {isCurrent ? (
        <span className={styles.label} aria-live="polite">
          {name(month)}
        </span>
      ) : (
        <button
          type="button"
          className={styles.label}
          onClick={() => select(current)}
          aria-live="polite"
          title="Volver a este mes"
        >
          {name(month)}
        </button>
      )}
      <IconButton
        label={`Ver ${name(next).toLowerCase()}`}
        icon={<ChevronRight />}
        onClick={() => select(next)}
        disabled={isCurrent}
      />
    </div>
  )
}
