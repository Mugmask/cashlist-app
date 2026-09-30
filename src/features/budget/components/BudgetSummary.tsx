import { Amount, Card, ProgressBar } from '@/ui'
import type { BudgetOverview } from '../overview'
import styles from './BudgetSummary.module.css'

export function BudgetSummary({ totals }: Pick<BudgetOverview, 'totals'>) {
  const isOver = totals.remaining < 0

  return (
    <Card as="section" variant="hero" padding="lg" aria-label="Resumen del presupuesto">
      <span className={styles.label}>{isOver ? 'Te pasaste por' : 'Te quedan'}</span>
      <Amount value={Math.abs(totals.remaining)} size="xl" tone={isOver ? 'danger' : 'default'} />
      <ProgressBar
        label="Presupuesto usado"
        value={totals.spent}
        max={totals.limit}
        className={styles.bar}
      />
      <div className={styles.footer}>
        <span>
          Gastado <Amount value={totals.spent} size="sm" />
        </span>
        <span>
          de <Amount value={totals.limit} size="sm" />
        </span>
      </div>
    </Card>
  )
}
