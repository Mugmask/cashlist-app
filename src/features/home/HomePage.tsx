import { useLiveQuery } from 'dexie-react-hooks'
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
  getExpensesBefore,
  isFixed,
  totalsByCategory,
  useAddExpense,
  useMonthExpenses,
} from '@/features/expenses'
import { FixedHomeCard, useFixedOverview } from '@/features/fixed'
import { getIncomesBefore, useMonthIncomes } from '@/features/incomes'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { ShoppingHomeCard } from '@/features/shopping'
import { Amount, Button, Card, cx, EmptyState, PageHeader, ProgressBar, Stack } from '@/ui'
import { formatMonthName, fromPeriod, shiftMonth, toPeriod } from '@/utils/dates'
import { carryOver, type CarryOver } from './carryOver'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 3 // a glance; the whole breakdown is one tap away
const RECENT_COUNT = 5

export function HomePage() {
  const { month: selected, isCurrent } = useMonth()
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const earlier = useLiveQuery(
    async () => ({
      expenses: await getExpensesBefore(selected),
      incomes: await getIncomesBefore(selected),
    }),
    [selected.getTime()],
  )
  const received = useMonthIncomes(selected)?.total ?? 0
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
  const monthlyIncome = profile?.monthlyIncome
  // What the month has to spend: the monthly income plus whatever else came in
  const income =
    monthlyIncome !== undefined || received > 0 ? (monthlyIncome ?? 0) + received : undefined
  // Fixed expenses not paid yet: money already spoken for this month
  const committed = isCurrent ? (fixed?.totals.remaining ?? 0) : 0
  // What the months before left over or overspent comes along into this one. Only with a
  // monthly income: without one, every month before would look overspent by all it spent.
  const carry =
    monthlyIncome !== undefined && earlier
      ? carryOver(earlier.expenses, monthlyIncome, toPeriod(selected), earlier.incomes)
      : null

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

      {income === undefined ? (
        // Without any income there's nothing to compare with: the month's total leads
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
          </Card>
        </Link>
      ) : (
        <MonthBalance
          monthName={monthName}
          income={income}
          carry={carry}
          spent={total}
          committed={committed}
        />
      )}

      {/* Side by side, small: what's left of the fixed ones and what's on the card */}
      <div className={styles.tiles}>
        <FixedHomeCard />
        <CardHomeCard />
      </div>
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
                      const { label, color } = getCategory(c.category)
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
                              color={color}
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

// The month's answer: what's left (or how much over), and how it adds up, each line leading
// to where it comes from. What came in counts what the months before left over or overspent;
// with fixed expenses still to pay, what's really free once they're paid.
function MonthBalance({
  monthName,
  income,
  carry,
  spent,
  committed,
}: {
  monthName: string
  income: number
  carry: CarryOver | null
  spent: number
  committed: number
}) {
  const available = income + (carry?.amount ?? 0)
  const left = available - spent
  const free = left - committed
  const over = left < 0

  return (
    <Card as="section" variant="hero" padding="lg" aria-labelledby="balance-title">
      <h2 id="balance-title" className={styles.heroLabel}>
        {over ? 'Te pasaste' : 'Te quedan'} en {monthName}
      </h2>
      <Amount value={Math.abs(left)} size="xl" tone={over ? 'danger' : 'default'} />
      {/* Nothing available (the months before ate it all) is a full bar, already over */}
      <ProgressBar
        label="Ingresos gastados"
        value={available > 0 ? spent : 1}
        max={available > 0 ? available : 1}
        tone="limit"
        className={styles.balanceBar}
      />
      <ul className={styles.balance}>
        <li>
          <Link to="/incomes" className={styles.balanceLink}>
            <span>Ingresos</span>
            <Amount value={income} size="sm" compactFrom={10_000_000} />
            <ChevronRight aria-hidden />
          </Link>
        </li>
        {carry && carry.amount !== 0 && (
          <li className={styles.balanceRow}>
            <span>{describeMonths(carry)}</span>
            <Amount
              value={carry.amount}
              size="sm"
              tone={carry.amount < 0 ? 'danger' : 'accent'}
              compactFrom={10_000_000}
            />
          </li>
        )}
        <li>
          <Link to="/expenses" className={styles.balanceLink}>
            <span>Gastaste</span>
            <Amount value={spent} size="sm" compactFrom={10_000_000} />
            <ChevronRight aria-hidden />
          </Link>
        </li>
      </ul>
      {committed > 0 && !over && (
        <p className={cx(styles.afterFixed, free < 0 && styles.over)}>
          Después de los fijos:{' '}
          <Amount
            value={free}
            size="sm"
            tone={free < 0 ? 'danger' : 'default'}
            compactFrom={10_000_000}
          />
        </p>
      )}
    </Card>
  )
}

// "Septiembre", or "Agosto a octubre" when it adds up several months
function describeMonths({ from, to }: CarryOver) {
  const first = formatMonthName(fromPeriod(from))
  const label = from === to ? first : `${first} a ${formatMonthName(fromPeriod(to))}`
  return label.charAt(0).toUpperCase() + label.slice(1)
}
