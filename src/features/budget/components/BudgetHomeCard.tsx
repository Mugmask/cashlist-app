import { ChartPie, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Amount, Card, ProgressBar } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { useBudgetOverview } from '../useBudgetOverview'
import styles from './BudgetHomeCard.module.css'

const WARNING_RATIO = 0.8

// "1 categoría pasada", "2 categorías pasadas"
function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? `1 categoría ${singular}` : `${count} categorías ${plural}`
}

// Budget at a glance on the home screen; links to the full budget page
export function BudgetHomeCard() {
  const overview = useBudgetOverview()

  if (!overview) return null

  const { lines, totals } = overview

  if (lines.length === 0) {
    return (
      <Link to="/budget" className={styles.link}>
        <Card className={styles.cta}>
          <span className={styles.ctaIcon} aria-hidden>
            <ChartPie />
          </span>
          <div className={styles.ctaText}>
            <strong>Armá tu presupuesto</strong>
            <span>Ponele un tope a cada categoría</span>
          </div>
          <ChevronRight aria-hidden className={styles.chevron} />
        </Card>
      </Link>
    )
  }

  const isOver = totals.remaining < 0
  const overCount = lines.filter((l) => l.ratio > 1).length
  const nearCount = lines.filter((l) => l.ratio >= WARNING_RATIO && l.ratio <= 1).length

  return (
    <Link to="/budget" className={styles.link}>
      <Card>
        <div className={styles.header}>
          <span className={styles.title}>Presupuesto</span>
          <ChevronRight aria-hidden className={styles.chevron} />
        </div>
        <div className={styles.amountLine}>
          <span className={styles.muted}>{isOver ? 'Te pasaste por' : 'Te quedan'}</span>
          <Amount
            value={Math.abs(totals.remaining)}
            size="lg"
            tone={isOver ? 'danger' : 'default'}
          />
        </div>
        <ProgressBar label="Presupuesto usado" value={totals.spent} max={totals.limit} />
        <div className={styles.footer}>
          <span>de {formatCurrencyShort(totals.limit)}</span>
          {overCount > 0 ? (
            <span className={styles.danger}>
              {pluralize(overCount, 'pasada', 'pasadas')} del tope
            </span>
          ) : (
            nearCount > 0 && (
              <span className={styles.warning}>
                {pluralize(nearCount, 'cerca', 'cerca')} del tope
              </span>
            )
          )}
        </div>
      </Card>
    </Link>
  )
}
