import { ChevronRight, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  CategoryIcon,
  ExpenseRow,
  getCategory,
  totalsByCategory,
  useMonthExpenses,
} from '@/features/expenses'
import { Amount, Card, EmptyState, ProgressBar, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 4
const RECENT_COUNT = 5

export function HomePage() {
  const month = useMonthExpenses()

  if (!month) return null

  const { expenses, total, dailyAverage } = month

  return (
    <Stack gap={6}>
      <section className={styles.hero} aria-label="Resumen del mes">
        <span className={styles.heroLabel}>Gastaste en {formatMonthName()}</span>
        <Amount value={total} size="xl" />
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Promedio diario</dt>
            <dd>
              <Amount value={dailyAverage} size="sm" />
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Movimientos</dt>
            <dd>{expenses.length}</dd>
          </div>
        </dl>
      </section>

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Arrancá el mes"
          description="Tocá el + de abajo para cargar tu primer gasto."
        />
      ) : (
        <>
          <HomeSection title="En qué gastaste">
            <Card>
              <ul className={styles.categories}>
                {totalsByCategory(expenses)
                  .slice(0, TOP_CATEGORIES)
                  .map((c) => {
                    const { label } = getCategory(c.category)
                    const share = c.total / total
                    return (
                      <li key={c.category} className={styles.category}>
                        <CategoryIcon category={c.category} />
                        <div className={styles.categoryBody}>
                          <div className={styles.categoryLine}>
                            <span className={styles.categoryLabel}>{label}</span>
                            <Amount value={c.total} size="sm" />
                          </div>
                          <div className={styles.categoryLine}>
                            <ProgressBar
                              label={`${label}: ${Math.round(share * 100)}% del total`}
                              value={c.total}
                              max={total}
                              tone="accent"
                              className={styles.share}
                            />
                            <span className={styles.percent}>{Math.round(share * 100)}%</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </Card>
          </HomeSection>

          <HomeSection
            title="Últimos movimientos"
            action={
              <Link to="/expenses" className={styles.seeAll}>
                Ver todos
                <ChevronRight aria-hidden />
              </Link>
            }
          >
            <Card padding="none">
              <ul className={styles.list}>
                {expenses.slice(0, RECENT_COUNT).map((e) => (
                  <ExpenseRow key={e.id} expense={e} />
                ))}
              </ul>
            </Card>
          </HomeSection>
        </>
      )}
    </Stack>
  )
}

function HomeSection({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-label={title}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}
