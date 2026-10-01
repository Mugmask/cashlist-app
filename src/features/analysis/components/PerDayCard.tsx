import type { CSSProperties } from 'react'
import { Amount, cx, VisuallyHidden } from '@/ui'
import { formatCurrency, formatCurrencyShort, formatCurrencyTiny } from '@/utils/currency'
import type { PerDay, Week } from '../perDay'
import styles from './PerDayCard.module.css'

export interface PerDayCardProps {
  perDay: PerDay
  weeks: readonly Week[]
  monthName: string // "octubre"
  lastDay: number // the month's last day, for "hasta el 31"
}

// How the month goes, per day. While it's going on and there's an income: what can still go
// each day, the pace so far and where it ends at that pace. A month gone: how much went per
// day. Below, what each week took, so a week that ran away shows at a glance.
export function PerDayCard({ perDay, weeks, monthName, lastDay }: PerDayCardProps) {
  const { pace, budget } = perDay
  const ongoing = weeks.some((w) => w.when !== 'past')
  const priciest = weeks.reduce((top, w) => (w.total > top.total ? w : top), weeks[0])

  return (
    <div className={styles.card}>
      {budget ? (
        budget.free > 0 ? (
          <div>
            <span className={styles.label}>Podés gastar</span>
            <p className={styles.headline}>
              <Amount value={budget.perDay} size="lg" />
              <span className={styles.unit}>por día</span>
            </p>
            <span className={styles.label}>
              hasta el {lastDay} ·{' '}
              {budget.daysLeft === 1 ? 'queda hoy' : `faltan ${budget.daysLeft} días`}
            </span>
          </div>
        ) : (
          <div>
            <span className={styles.label}>Ya no te queda margen en {monthName}</span>
            <p className={styles.headline}>
              <Amount value={-budget.free} size="lg" tone="danger" />
              <span className={styles.unit}>de más, contando los fijos que faltan</span>
            </p>
          </div>
        )
      ) : (
        <div>
          <span className={styles.label}>
            {ongoing ? 'Venís gastando' : `En ${monthName} gastaste`}
          </span>
          <p className={styles.headline}>
            <Amount value={pace} size="lg" />
            <span className={styles.unit}>por día</span>
          </p>
          <span className={styles.label}>en gastos variables</span>
        </div>
      )}

      {budget && (
        <ul className={styles.facts}>
          <li>
            Venís gastando <strong>{formatCurrencyShort(pace)}</strong> por día en variables
          </li>
          {budget.free > 0 && (
            <li>
              Si seguís así, a fin de mes{' '}
              {budget.projected >= 0 ? (
                <>
                  te sobran{' '}
                  <strong className={styles.good}>{formatCurrencyShort(budget.projected)}</strong>
                </>
              ) : (
                <>
                  te faltan{' '}
                  <strong className={styles.bad}>{formatCurrencyShort(-budget.projected)}</strong>
                </>
              )}
            </li>
          )}
        </ul>
      )}

      <WeekBars weeks={weeks} />
      {!ongoing && priciest.total > 0 && (
        <p className={styles.note}>
          La semana del {priciest.from} al {priciest.to} fue la que más gastaste
        </p>
      )}
    </div>
  )
}

// One bar per week, its total on top. Weeks still to come are an empty outline, the one
// going on is named, so nothing relies on color alone. A table carries the same for screen
// readers.
function WeekBars({ weeks }: { weeks: readonly Week[] }) {
  const max = Math.max(...weeks.map((w) => w.total), 1)

  return (
    <figure className={styles.weeks} aria-label="Gasto variable por semana">
      <div className={styles.bars} aria-hidden>
        {weeks.map((w) => (
          <div
            key={w.from}
            className={cx(styles.week, styles[w.when])}
            title={`Del ${w.from} al ${w.to}: ${formatCurrency(w.total)}`}
          >
            <span className={styles.value}>
              {w.when === 'future' ? '' : formatCurrencyTiny(w.total)}
            </span>
            <span className={styles.track}>
              <span
                className={styles.bar}
                style={{ '--share': w.when === 'future' ? 1 : w.total / max } as CSSProperties}
              />
            </span>
            <span className={styles.range}>
              {w.when === 'current' ? 'Esta semana' : `${w.from}–${w.to}`}
            </span>
          </div>
        ))}
      </div>
      <VisuallyHidden as="div">
        <table>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.from}>
                <th scope="row">
                  Del {w.from} al {w.to}
                  {w.when === 'current' && ' (esta semana)'}
                </th>
                <td>{w.when === 'future' ? 'Todavía no' : formatCurrency(w.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </figure>
  )
}
