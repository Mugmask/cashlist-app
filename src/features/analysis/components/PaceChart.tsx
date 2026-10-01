import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatCurrency, formatCurrencyShort, formatCurrencyTiny } from '@/utils/currency'
import styles from './PaceChart.module.css'

export interface PaceChartProps {
  current: readonly number[] // spent by the end of each day so far (index 0 is the 1st)
  previous: readonly number[] // the month before, every day
  days: number // days in the month being looked at
  income?: number // what came in this month: a line to stay under
  monthName: string // "octubre"
  previousName: string // "septiembre"
  ongoing: boolean // the month isn't over: the one before is compared up to the same day
}

const W = 300 // drawing units; the SVG stretches to the card, strokes don't
const H = 140

// How the month is going: what's been spent by each day (the accent line, with a soft area
// under it), against the month before (gray) and against what came in (a dashed line).
// Touching or hovering it shows any day's numbers; the arrow keys do the same. The legend
// carries the latest values, so nothing is only in the tooltip.
export function PaceChart({
  current,
  previous,
  days,
  income,
  monthName,
  previousName,
  ongoing,
}: PaceChartProps) {
  const gradient = useId()
  const [active, setActive] = useState<number | null>(null)
  const today = current.length - 1
  const spent = current[today] ?? 0
  // Going: the month before up to the same day; over: the month before whole
  const before = previous[ongoing ? Math.min(today, previous.length - 1) : previous.length - 1] ?? 0
  const max = Math.max(income ?? 0, spent, previous[previous.length - 1] ?? 0, 1) * 1.1

  const x = (i: number) => (days > 1 ? (i / (days - 1)) * W : 0)
  const y = (v: number) => H - (v / max) * H
  const line = (values: readonly number[]) =>
    values
      .slice(0, days)
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ')
  const area = `${line(current)} L${x(today).toFixed(1)},${H} L0,${H} Z`

  const pct = (i: number) => `${(x(i) / W) * 100}%`
  const shown = active ?? today
  const pick = (clientX: number, box: DOMRect) => {
    const i = Math.round(((clientX - box.left) / box.width) * (days - 1))
    setActive(Math.max(0, Math.min(days - 1, i)))
  }
  const onPointer = (e: PointerEvent<HTMLDivElement>) =>
    pick(e.clientX, e.currentTarget.getBoundingClientRect())
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    setActive((i) => Math.max(0, Math.min(days - 1, (i ?? today) + step)))
  }
  const value = (values: readonly number[], i: number) =>
    i < values.length ? values[i] : undefined

  return (
    <div className={styles.pace}>
      <ul className={styles.legend}>
        <li>
          <span className={styles.swatch} data-series="current" aria-hidden />
          <span className={styles.name}>{capitalize(monthName)}</span>
          <strong>{formatCurrencyShort(spent)}</strong>
        </li>
        <li>
          <span className={styles.swatch} data-series="previous" aria-hidden />
          <span className={styles.name}>
            {capitalize(previousName)}
            {ongoing && ', al mismo día'}
          </span>
          <strong>{formatCurrencyShort(before)}</strong>
        </li>
        {income !== undefined && (
          <li>
            <span className={styles.swatch} data-series="income" aria-hidden />
            <span className={styles.name}>Entró</span>
            <strong>{formatCurrencyShort(income)}</strong>
          </li>
        )}
      </ul>

      <div
        className={styles.plot}
        role="img"
        tabIndex={0}
        aria-label={`Gastaste ${formatCurrency(spent)} en ${monthName}; ${ongoing ? 'a esta altura de' : 'en'} ${previousName} ${ongoing ? 'llevabas' : 'gastaste'} ${formatCurrency(before)}${income === undefined ? '' : `, de ${formatCurrency(income)} que entraron`}. Flechas para ver cada día.`}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} className={styles.grid} x1="0" x2={W} y1={H * f} y2={H * f} />
          ))}
          {income !== undefined && (
            <line className={styles.income} x1="0" x2={W} y1={y(income)} y2={y(income)} />
          )}
          <path className={styles.previous} d={line(previous)} />
          <path d={area} fill={`url(#${gradient})`} />
          <path className={styles.current} d={line(current)} />
        </svg>

        {active !== null && <span className={styles.crosshair} style={{ left: pct(active) }} />}
        <span
          className={styles.dot}
          style={{
            left: pct(Math.min(shown, today)),
            top: `${(y(value(current, Math.min(shown, today)) ?? 0) / H) * 100}%`,
          }}
        />
        {active === null && (
          <span
            className={styles.endLabel}
            // Kept inside the card near either edge (on the 1st, or on the last day)
            style={{
              left: `clamp(28px, ${pct(today)}, calc(100% - 28px))`,
              top: `${(y(spent) / H) * 100}%`,
            }}
          >
            {formatCurrencyTiny(spent)}
          </span>
        )}
        {active !== null && (
          <span
            className={styles.tooltip}
            style={{ left: `clamp(56px, ${pct(active)}, calc(100% - 56px))` }}
            aria-live="polite"
          >
            <span className={styles.tooltipDay}>Día {active + 1}</span>
            {value(current, active) !== undefined && (
              <span>
                <span className={styles.swatch} data-series="current" />
                {formatCurrencyShort(value(current, active)!)}
              </span>
            )}
            {value(previous, active) !== undefined && (
              <span>
                <span className={styles.swatch} data-series="previous" />
                {formatCurrencyShort(value(previous, active)!)}
              </span>
            )}
          </span>
        )}
      </div>

      <div className={styles.axis} aria-hidden>
        <span>1</span>
        <span>{Math.round(days / 2)}</span>
        <span>{days}</span>
      </div>
    </div>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
