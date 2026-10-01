import { cx } from '@/ui'
import { formatCurrency, formatCurrencyTiny } from '@/utils/currency'
import { formatMonthName, formatShortMonth } from '@/utils/dates'
import type { MonthPoint } from '../useMonthTrend'
import styles from './TrendChart.module.css'

export interface TrendChartProps {
  points: readonly MonthPoint[] // oldest first
  selected: Date
  thisYear: number
  onSelect: (month: Date) => void
}

// One column per month, the month being looked at in the accent and the rest in gray
// (emphasis: the story is "this month against the others"). Its value is labeled on top;
// any other shows on hover or focus. Tapping a column goes to that month. Every column says
// its month and total to screen readers, so nothing depends on seeing the bars.
export function TrendChart({ points, selected, thisYear, onSelect }: TrendChartProps) {
  const max = Math.max(...points.map((p) => p.total), 1)

  return (
    <div className={styles.chart} role="group" aria-label="Gasto de los últimos meses">
      {points.map((p) => {
        const isSelected = p.month.getTime() === selected.getTime()
        const height = (p.total / max) * 100
        return (
          <button
            key={p.month.getTime()}
            type="button"
            className={cx(styles.column, isSelected && styles.selected)}
            onClick={() => onSelect(p.month)}
            aria-pressed={isSelected}
            aria-label={`${formatMonthName(p.month)}: ${formatCurrency(p.total)}`}
          >
            <span className={styles.plot} aria-hidden>
              <span className={styles.value}>{formatCurrencyTiny(p.total)}</span>
              {p.total > 0 && <span className={styles.bar} style={{ height: `${height}%` }} />}
            </span>
            <span className={styles.month} aria-hidden>
              {formatShortMonth(p.month, thisYear)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
