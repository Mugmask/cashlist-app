import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Amount, Card, cx } from '@/ui'
import { dueLabel, urgentLines } from '../dueLabel'
import type { FixedOverview } from '../useFixedOverview'
import styles from './FixedHomeCard.module.css'

const PREVIEW_COUNT = 2 // a small tile: the names have little room

// This month's fixed expenses at a glance, a small tile on home: what's left to pay and which
// ones; leads to the fixed expenses screen. Home loads the overview, so the tile shows with it.
export function FixedHomeCard({ overview }: { overview: FixedOverview }) {
  const { pending, paid, totals } = overview
  // Which ones are left, like the shopping card: "Internet, Netflix y 2 más"
  const names = pending.slice(0, PREVIEW_COUNT).map((l) => l.fixed.name)
  const rest = pending.length - names.length
  // Overdue or due soon: that goes first, in place of the names
  const urgent = urgentLines(pending)
  const first = urgent[0]
  const alert = first && dueLabel(first.due!)

  return (
    <Link to="/fixed" className={styles.link}>
      <Card as="section" className={styles.tile} aria-labelledby="fixed-tile-title">
        <header className={styles.header}>
          <h2 id="fixed-tile-title" className={styles.title}>
            Fijos
          </h2>
          <ChevronRight aria-hidden className={styles.chevron} />
        </header>
        {pending.length === 0 && paid.length === 0 ? (
          <>
            <strong className={styles.state}>Cargalos</strong>
            <span className={styles.muted}>Alquiler, internet…</span>
          </>
        ) : pending.length === 0 ? (
          <>
            <strong className={styles.state}>Todos pagados</strong>
            <span className={styles.muted}>
              {paid.length === 1 ? '1 pago' : `${paid.length} pagos`}
            </span>
          </>
        ) : (
          <>
            <Amount value={totals.remaining} size="lg" />
            {alert ? (
              <span className={cx(styles.muted, styles[alert.tone])} role="status">
                {first.fixed.name} {alert.text.toLowerCase()}
                {urgent.length > 1 && ` y ${urgent.length - 1} más`}
              </span>
            ) : (
              <span className={styles.muted}>
                {pending.length === 1 ? 'Falta ' : `Faltan ${pending.length}: `}
                {names.join(', ')}
                {rest > 0 && ` y ${rest} más`}
              </span>
            )}
          </>
        )}
      </Card>
    </Link>
  )
}
