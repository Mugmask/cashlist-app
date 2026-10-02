import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  type CarryOver,
  Change,
  changeByCategory,
  describeChange,
  useMonthBalance,
  variableChange,
} from '@/features/analysis'
import { CardHomeCard, useCardSummary } from '@/features/card'
import {
  CategoryIcon,
  ExpenseDetailSheet,
  ExpenseRow,
  getCategory,
  isFixed,
  totalsByCategory,
  useAddExpense,
  useCategories,
  useMonthExpenses,
} from '@/features/expenses'
import { FixedHomeCard, useFixedOverview } from '@/features/fixed'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { ShoppingHomeCard, useShoppingList } from '@/features/shopping'
import {
  Amount,
  Button,
  Card,
  cx,
  EmptyState,
  PageHeader,
  PageLoader,
  ProgressBar,
  Stack,
  VisuallyHidden,
} from '@/ui'
import { formatMonthName, fromPeriod, shiftMonth } from '@/utils/dates'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 3 // a glance; the whole breakdown is one tap away
const RECENT_COUNT = 5

export function HomePage() {
  const { month: selected, isCurrent, today: now } = useMonth()
  useCategories() // re-renders when the user edits their categories: names and colors below
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const balance = useMonthBalance(selected)
  const fixed = useFixedOverview(selected)
  const card = useCardSummary(selected)
  const shopping = useShoppingList()
  const addExpense = useAddExpense()
  const profile = useProfile()
  const [openId, setOpenId] = useState<string | null>(null)

  // Everything at once: numbers that fill in one by one look like they're changing
  if (!month || !previous || !balance || !fixed || !card || !shopping) {
    return <PageLoader />
  }
  if (profile === undefined) return <PageLoader /> // null is loaded: no profile yet

  const { expenses, total, variableTotal } = month
  const monthName = formatMonthName(selected)
  const before = previous.expenses
  // "Hola, Juan": the first name only; until the profile has one (a new user), "Hola, wachin"
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
  // What the month has, what went and what's spoken for: the same balance Analysis uses
  const { income, carry, committed } = balance

  return (
    <Stack gap={6}>
      <PageHeader
        title={`Hola, ${firstName || 'wachin'}`}
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
        <FixedHomeCard overview={fixed} />
        <CardHomeCard summary={card} />
      </div>
      {/* The shopping list is about now, not about the month being looked at */}
      {isCurrent && <ShoppingHomeCard list={shopping} />}

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

// The month's answer: what's left (or how much over) and, right under it, what's really free
// once the fixed expenses still to pay are paid. A bar splits what came in into spent, fixed
// and free; the lines below add it up, signed, each leading to where it comes from. What came
// in counts what the months before left over or overspent.
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
    <Card
      as="section"
      variant="hero"
      glow={over ? 'danger' : 'accent'}
      padding="lg"
      aria-labelledby="balance-title"
    >
      <h2 id="balance-title" className={styles.heroLabel}>
        {over ? 'Te pasaste' : 'Te quedan'} en {monthName}
      </h2>
      <Amount value={Math.abs(left)} size="xl" tone={over ? 'danger' : 'default'} />
      {committed > 0 && !over && (
        <p className={styles.afterFixed}>
          {free < 0 ? (
            <>
              Te faltan <Amount value={-free} size="sm" tone="danger" compactFrom={10_000_000} />{' '}
              para los fijos
            </>
          ) : (
            <>
              <Amount value={free} size="sm" tone="accent" compactFrom={10_000_000} /> libres
              después de los fijos
            </>
          )}
        </p>
      )}
      <BalanceBar
        available={available}
        spent={spent}
        fixed={over ? 0 : Math.min(committed, left)}
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
            <span>
              {carry.amount < 0 ? 'Te faltó' : 'Te sobró'} en {describeMonths(carry)}
            </span>
            <Signed value={carry.amount} tone={carry.amount < 0 ? 'danger' : 'default'} />
          </li>
        )}
        <li>
          <Link to="/expenses" className={styles.balanceLink}>
            <span>Gastaste</span>
            <Signed value={-spent} />
            <ChevronRight aria-hidden />
          </Link>
        </li>
      </ul>
    </Card>
  )
}

// One line of the sum, with its sign: + what adds, − what takes away
function Signed({ value, tone = 'default' }: { value: number; tone?: 'default' | 'danger' }) {
  return (
    <span className={cx(styles.signed, tone === 'danger' && styles.over)}>
      <span aria-hidden>{value < 0 ? '−' : '+'}</span>
      <VisuallyHidden>{value < 0 ? 'menos' : 'más'}</VisuallyHidden>
      <Amount value={Math.abs(value)} size="sm" tone={tone} compactFrom={10_000_000} />
    </span>
  )
}

// What came in, split: spent (the accent, red once over), the fixed ones still to pay
// (striped) and what's free (the track). The legend under it says the same in words.
function BalanceBar({
  available,
  spent,
  fixed,
}: {
  available: number
  spent: number
  fixed: number
}) {
  // Nothing available (the months before ate it all) is a full bar, already over
  const over = available <= 0 || spent > available
  const percent = (amount: number) => (available > 0 ? Math.round((amount / available) * 100) : 100)
  const width = (amount: number) => `${Math.min(100, Math.max(0, percent(amount)))}%`

  return (
    <div className={styles.balanceBar}>
      <div className={styles.barTrack} aria-hidden>
        <span
          className={cx(styles.barSpent, over && styles.barOver)}
          style={{ width: over ? '100%' : width(spent) }}
        />
        {fixed > 0 && <span className={styles.barFixed} style={{ width: width(fixed) }} />}
      </div>
      <p className={styles.barLegend}>
        {over ? (
          available > 0 ? (
            `Gastaste ${percent(spent)}% de lo que entró`
          ) : (
            'Los meses anteriores se llevaron lo que entró'
          )
        ) : (
          <>
            <span className={styles.legendSpent}>{percent(spent)}% gastado</span>
            {fixed > 0 && <span className={styles.legendFixed}>{percent(fixed)}% en fijos</span>}
          </>
        )}
      </p>
    </div>
  )
}

// "septiembre", or "agosto a octubre" when it adds up several months: mid-sentence
function describeMonths({ from, to }: CarryOver) {
  const first = formatMonthName(fromPeriod(from))
  return from === to ? first : `${first} a ${formatMonthName(fromPeriod(to))}`
}
