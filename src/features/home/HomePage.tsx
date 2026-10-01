import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { CardHomeCard } from '@/features/card'
import {
  CategoryIcon,
  ExpenseDetailSheet,
  ExpenseRow,
  getCategory,
  isFixed,
  totalsByCategory,
  useAddExpense,
  useMonthExpenses,
} from '@/features/expenses'
import { FixedHomeCard, useFixedOverview } from '@/features/fixed'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { ShoppingHomeCard } from '@/features/shopping'
import { Amount, Button, Card, cx, EmptyState, PageHeader, ProgressBar, Stack } from '@/ui'
import { formatMonthName, shiftMonth } from '@/utils/dates'
import { changeByCategory } from './comparison'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 4
const RECENT_COUNT = 5

export function HomePage() {
  const { month: selected, isCurrent } = useMonth()
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const fixed = useFixedOverview(selected)
  const addExpense = useAddExpense()
  const profile = useProfile()
  const income = profile?.monthlyIncome
  // "Hola, Francisco": the first name only, and just "Hola" until the profile has one
  const firstName = profile?.name?.trim().split(/\s+/)[0]
  const [openId, setOpenId] = useState<string | null>(null)
  const [now] = useState(() => new Date()) // read once: only the day of the month matters here

  if (!month) return null

  const { expenses, total, fixedTotal, variableTotal, dailyAverage } = month
  const monthName = formatMonthName(selected)
  // Where the money goes, without fixed payments: rent would dwarf everything you can change
  const variableByCategory = totalsByCategory(expenses.filter((e) => !isFixed(e)))
  const changes = previous
    ? changeByCategory(expenses, previous.expenses, isCurrent, now)
    : new Map<string, number>()
  // Fixed expenses not paid yet: money already spoken for this month
  const committed = isCurrent ? (fixed?.totals.remaining ?? 0) : 0

  return (
    <Stack gap={6}>
      <PageHeader title={firstName ? `Hola, ${firstName}` : 'Hola'} />
      <Card as="section" variant="hero" padding="lg" aria-label="Resumen del mes">
        <span className={styles.heroLabel}>Gastaste en {monthName}</span>
        <Amount value={total} size="xl" />
        {income !== undefined && <IncomeBar spent={total} income={income} committed={committed} />}
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
              <Amount value={Math.round(dailyAverage)} size="sm" compactFrom={1_000_000} />
            </dd>
          </div>
        </dl>
      </Card>

      <FixedHomeCard />
      <CardHomeCard />
      {/* The shopping list is about now, not about the month being looked at */}
      {isCurrent && <ShoppingHomeCard />}

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title={
            isCurrent ? 'Todavía no cargaste gastos este mes' : `No hay gastos en ${monthName}`
          }
          description={
            isCurrent ? 'Cargá tu primer gasto y mirá en qué se va la plata.' : undefined
          }
          action={
            isCurrent && (
              <Button size="lg" icon={<Plus aria-hidden />} onClick={addExpense}>
                Cargar gasto
              </Button>
            )
          }
        />
      ) : (
        <>
          {variableByCategory.length > 0 && (
            <HomeSection
              title="En qué se va la plata"
              action={
                changes.size > 0 && (
                  <span className={styles.versus}>
                    vs {formatMonthName(shiftMonth(selected, -1))}
                  </span>
                )
              }
            >
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
                            <span className={styles.categoryAmount}>
                              <Change value={changes.get(c.category)} />
                              <Amount value={c.total} size="sm" compactFrom={10_000_000} />
                            </span>
                          </div>
                          <ProgressBar
                            label={`${label}: ${Math.round(share * 100)}% de lo variable`}
                            value={c.total}
                            max={variableTotal}
                            tone="accent"
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </HomeSection>
          )}

          <HomeSection
            title="Últimos gastos"
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
                  <ExpenseRow key={e.id} expense={e} onOpen={setOpenId} />
                ))}
              </ul>
            </Card>
            <ExpenseDetailSheet expenseId={openId} onClose={() => setOpenId(null)} />
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

// "+18%" against the month before: spending more stands out, spending less is good news
function Change({ value }: { value: number | undefined }) {
  if (value === undefined) return null
  const percent = Math.round(value * 100)
  if (percent === 0) return null
  const tone = percent >= 10 ? styles.up : percent <= -10 ? styles.down : undefined
  return (
    <span className={cx(styles.change, tone)}>
      {percent > 0 ? '+' : '−'}
      {Math.abs(percent)}%
    </span>
  )
}

// How much of the month's income is spent, once the profile has it. With fixed expenses
// still to pay, what's really free once they're paid.
function IncomeBar({
  spent,
  income,
  committed,
}: {
  spent: number
  income: number
  committed: number
}) {
  const left = income - spent
  const free = left - committed
  return (
    <div className={styles.income}>
      <ProgressBar label="Ingreso gastado" value={spent} max={income} tone="limit" />
      <div className={styles.incomeLine}>
        <span className={left < 0 ? styles.over : undefined}>
          {left < 0 ? 'Te pasaste' : 'Te quedan'}{' '}
          <Amount value={Math.abs(left)} size="sm" compactFrom={1_000_000} />
        </span>
        <span>
          de <Amount value={income} size="sm" compactFrom={1_000_000} />
        </span>
      </div>
      {committed > 0 && left >= 0 && (
        <p className={cx(styles.afterFixed, free < 0 && styles.over)}>
          Después de los fijos:{' '}
          <Amount
            value={free}
            size="sm"
            tone={free < 0 ? 'danger' : 'default'}
            compactFrom={1_000_000}
          />
        </p>
      )}
    </div>
  )
}
