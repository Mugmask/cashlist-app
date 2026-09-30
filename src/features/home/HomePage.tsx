import { ChevronRight, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BudgetHomeCard } from '@/features/budget'
import {
  CategoryIcon,
  ExpenseRow,
  getCategory,
  isFixed,
  totalsByCategory,
  useMonthExpenses,
} from '@/features/expenses'
import { FixedHomeCard } from '@/features/fixed'
import { ShoppingHomeCard } from '@/features/shopping'
import { Amount, Card, EmptyState, ProgressBar, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 4
const RECENT_COUNT = 5

export function HomePage() {
  const month = useMonthExpenses()

  if (!month) return null

  const { expenses, total, fixedTotal, variableTotal, dailyAverage } = month
  // Where the money goes, without fixed payments: rent would dwarf everything you can change
  const variableByCategory = totalsByCategory(expenses.filter((e) => !isFixed(e)))

  return (
    <Stack gap={6}>
      <Card as="section" variant="hero" padding="lg" aria-label="Resumen del mes">
        <span className={styles.heroLabel}>Gastaste en {formatMonthName()}</span>
        <Amount value={total} size="xl" />
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Variables</dt>
            <dd>
              <Amount value={variableTotal} size="sm" compactFrom={1_000_000} />
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Fijos</dt>
            <dd>
              <Amount value={fixedTotal} size="sm" compactFrom={1_000_000} />
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>Por día</dt>
            <dd>
              <Amount value={dailyAverage} size="sm" compactFrom={1_000_000} />
            </dd>
          </div>
        </dl>
      </Card>

      <FixedHomeCard />
      <ShoppingHomeCard />

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Arrancá el mes"
          description="Tocá el + de abajo para cargar tu primer gasto."
        />
      ) : (
        <>
          {variableByCategory.length > 0 && (
            <HomeSection title="En qué se va la plata">
              <Card>
                <ul className={styles.categories}>
                  {variableByCategory.slice(0, TOP_CATEGORIES).map((c) => {
                    const { label } = getCategory(c.category)
                    const share = c.total / variableTotal
                    return (
                      <li key={c.category} className={styles.category}>
                        <CategoryIcon category={c.category} />
                        <div className={styles.categoryBody}>
                          <div className={styles.categoryLine}>
                            <span className={styles.categoryLabel}>{label}</span>
                            <Amount value={c.total} size="sm" compactFrom={10_000_000} />
                          </div>
                          <div className={styles.categoryLine}>
                            <ProgressBar
                              label={`${label}: ${Math.round(share * 100)}% de lo variable`}
                              value={c.total}
                              max={variableTotal}
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
              <p className={styles.footnote}>Sin contar los gastos fijos.</p>
            </HomeSection>
          )}

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

      <BudgetHomeCard />
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
