import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Change, changeByCategory, describeChange, variableChange } from '@/features/analysis'
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
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 3 // a glance; the whole breakdown is one tap away
const RECENT_COUNT = 5

export function HomePage() {
  const { month: selected, isCurrent } = useMonth()
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const fixed = useFixedOverview(selected)
  const addExpense = useAddExpense()
  const profile = useProfile()
  const [openId, setOpenId] = useState<string | null>(null)
  const [now] = useState(() => new Date()) // read once: only the day of the month matters here

  if (!month) return null

  const { expenses, total, variableTotal } = month
  const monthName = formatMonthName(selected)
  const before = previous?.expenses ?? []
  // "Hola, Francisco": the first name only, and just "Hola" until the profile has one
  const firstName = profile?.name?.trim().split(/\s+/)[0]
  // How the month goes, in one sentence under the greeting
  const insight =
    describeChange(
      variableChange(expenses, before, isCurrent, now),
      formatMonthName(shiftMonth(selected, -1)),
      isCurrent,
    ) ?? (isCurrent ? 'Así viene tu mes' : `Así fue tu ${monthName}`)
  // Where the money goes, without fixed payments: rent would dwarf everything you can change
  const topCategories = totalsByCategory(expenses.filter((e) => !isFixed(e))).slice(
    0,
    TOP_CATEGORIES,
  )
  const changes = changeByCategory(expenses, before, isCurrent, now)
  const income = profile?.monthlyIncome
  // Fixed expenses not paid yet: money already spoken for this month
  const committed = isCurrent ? (fixed?.totals.remaining ?? 0) : 0

  return (
    <Stack gap={6}>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : 'Hola'}
        subtitle={
          <Link to="/analysis" className={styles.insight}>
            {insight}
            <ChevronRight aria-hidden />
          </Link>
        }
      />

      {/* Everything on home leads somewhere: the month's total, to its expenses */}
      <Link
        to="/expenses"
        className={styles.cardLink}
        aria-label={`Ver los gastos de ${monthName}`}
      >
        <Card as="section" variant="hero" padding="lg">
          <span className={styles.heroLabel}>
            Gastaste en {monthName}
            <ChevronRight aria-hidden />
          </span>
          <Amount value={total} size="xl" />
          {income !== undefined && (
            <IncomeBar spent={total} income={income} committed={committed} />
          )}
        </Card>
      </Link>

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
          {topCategories.length > 0 && (
            <HomeSection
              title="En qué se va la plata"
              action={
                <Link to="/analysis" className={styles.seeAll}>
                  Ver más
                  <ChevronRight aria-hidden />
                </Link>
              }
            >
              {/* The whole card leads to the breakdown too: it's the obvious thing to tap */}
              <Link
                to="/analysis"
                className={styles.cardLink}
                aria-label="Ver en qué se va la plata"
              >
                <Card>
                  <ul className={styles.categories}>
                    {topCategories.map((c) => {
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
              </Link>
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
