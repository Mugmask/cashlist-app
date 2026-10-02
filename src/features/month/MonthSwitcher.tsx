import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthName, formatShortMonth, shiftMonth } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { useMonth } from './month'
import styles from './MonthSwitcher.module.css'

// ‹ Ago [Septiembre] Oct › in the header: moves every screen to another month. A glass track
// with the month shown on a raised thumb, like the segmented controls, so it reads as a
// control to slide along rather than a title. The arrows go with the month they lead to,
// small and muted. Another year's months show short with the year ("Dic 2025"); tapping the
// month (when looking at another) comes back to this month. On this month the next one stays,
// faded: the track keeps its shape and says there's nothing ahead yet.
export function MonthSwitcher() {
  const { month, current, isCurrent, select } = useMonth()
  const thisYear = current.getFullYear()
  const name =
    month.getFullYear() === thisYear
      ? capitalize(formatMonthName(month))
      : formatShortMonth(month, thisYear)
  const previous = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  // The neighbors without the year: the month in the middle already says which one
  const neighbor = (date: Date) => formatShortMonth(date, date.getFullYear())
  const longName = (date: Date) => `${formatMonthName(date)} ${date.getFullYear()}`

  return (
    <div className={styles.switcher} role="group" aria-label="Mes">
      <button
        type="button"
        className={styles.previous}
        aria-label={`Ver ${longName(previous)}`}
        onClick={() => select(previous)}
      >
        <ChevronLeft aria-hidden />
        {neighbor(previous)}
      </button>
      {isCurrent ? (
        <span className={styles.label} aria-live="polite">
          {name}
        </span>
      ) : (
        <button
          type="button"
          className={styles.label}
          onClick={() => select(current)}
          aria-live="polite"
          title="Volver a este mes"
        >
          {name}
        </button>
      )}
      <button
        type="button"
        className={styles.next}
        aria-label={`Ver ${longName(next)}`}
        onClick={() => select(next)}
        disabled={isCurrent}
      >
        {neighbor(next)}
        <ChevronRight aria-hidden />
      </button>
    </div>
  )
}
