import { PieChart } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ExpenseDetailSheet,
  ExpenseRow,
  getCategory,
  isFixed,
  totalsByCategory,
  useMonthExpenses,
  type MonthExpense,
} from '@/features/expenses'
import { useMonthIncomes } from '@/features/incomes'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { Amount, Card, EmptyState, PageHeader, Stack } from '@/ui'
import { daysInMonth, formatMonthName, shiftMonth } from '@/utils/dates'
import { changeByCategory, variableChange } from './comparison'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { PaceChart } from './components/PaceChart'
import { SplitBar, type SplitPart } from './components/SplitBar'
import { describeChange } from './insight'
import styles from './AnalysisPage.module.css'
import { cumulativeByDay } from './pace'

const TOP_COUNT = 5
const SPLIT_CATEGORIES = 5 // the bar stays readable; the rest goes together, in gray

// "En qué se va la plata": the month in depth, for the month picked in the header
export function AnalysisPage() {
  const { month: selected, isCurrent } = useMonth()
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const profile = useProfile()
  const received = useMonthIncomes(selected)?.total ?? 0
  const [openId, setOpenId] = useState<string | null>(null)
  const [now] = useState(() => new Date()) // read once: only the day of the month matters

  if (!month) return null

  const { expenses, total, fixedTotal, variableTotal } = month
  const monthName = formatMonthName(selected)
  const previousName = formatMonthName(shiftMonth(selected, -1))
  const before = previous?.expenses ?? []
  const insight = describeChange(
    variableChange(expenses, before, isCurrent, now),
    previousName,
    isCurrent,
  )
  const changes = changeByCategory(expenses, before, isCurrent, now)
  const cardTotal = expenses
    .filter((e) => e.paymentMethod === 'card')
    .reduce((sum, e) => sum + e.amount, 0)
  const biggest = topVariable(expenses)
  // Day by day: this month up to today (or whole, if it's gone), the one before whole
  const days = daysInMonth(selected)
  const spentByDay = cumulativeByDay(expenses, selected).slice(0, isCurrent ? now.getDate() : days)
  const previousByDay = cumulativeByDay(before, shiftMonth(selected, -1))
  const income = profile?.monthlyIncome === undefined ? undefined : profile.monthlyIncome + received

  return (
    <Stack gap={6}>
      <PageHeader title="En qué se va la plata" />

      {expenses.length === 0 ? (
        <EmptyState icon={<PieChart />} title={`No hay gastos en ${monthName}`} />
      ) : (
        <>
          <Card as="section" variant="hero" padding="lg" aria-label="Resumen del mes">
            <span className={styles.label}>Gastaste en {monthName}</span>
            <Amount value={total} size="xl" />
            {insight && <p className={styles.insight}>{insight}</p>}
          </Card>

          <Section title="Cómo viene el mes">
            <Card>
              <PaceChart
                current={spentByDay}
                previous={previousByDay}
                days={days}
                income={income}
                monthName={monthName}
                previousName={previousName}
                ongoing={isCurrent}
              />
            </Card>
          </Section>

          <Section title="En qué se va">
            <Card>
              <SplitBar label={`Gasto de ${monthName}`} parts={splitParts(expenses, fixedTotal)} />
            </Card>
            {/* Another way to cut the same total, so apart from the parts that add up to it */}
            {cardTotal > 0 && (
              <p className={styles.cardNote}>
                {Math.round((cardTotal / total) * 100)}% con tarjeta:{' '}
                <Amount value={cardTotal} size="sm" compactFrom={10_000_000} />
              </p>
            )}
          </Section>

          {variableTotal > 0 && (
            <Section title="Por categoría" hint="Sin contar los fijos">
              <Card padding="none">
                <CategoryBreakdown
                  expenses={expenses}
                  changes={changes}
                  onOpenExpense={setOpenId}
                />
              </Card>
            </Section>
          )}

          {biggest.length > 0 && (
            <Section title="Lo más grande del mes">
              <Card padding="none">
                <ul className={styles.list}>
                  {biggest.map((e) => (
                    <ExpenseRow key={e.id} expense={e} onOpen={setOpenId} />
                  ))}
                </ul>
              </Card>
            </Section>
          )}
        </>
      )}

      <ExpenseDetailSheet expenseId={openId} onClose={() => setOpenId(null)} />
    </Stack>
  )
}

// The month split for the bar: the biggest categories in their own colors, everything else
// (uncategorized included) together as "Otros", in its own color, and fixed expenses as one
// violet block, the hue of rent and services
function splitParts(expenses: readonly MonthExpense[], fixedTotal: number): SplitPart[] {
  const categories = totalsByCategory(expenses.filter((e) => !isFixed(e)))
  const named = categories.filter((c) => c.category !== 'other')
  const top = named.slice(0, SPLIT_CATEGORIES)
  const others = categories.filter((c) => !top.includes(c)).reduce((sum, c) => sum + c.total, 0)
  return [
    ...top.map((c) => {
      const { label, color } = getCategory(c.category)
      return { key: c.category, label, value: c.total, color }
    }),
    { key: 'others', label: 'Otros', value: others, color: getCategory('other').color },
    { key: 'fixed', label: 'Fijos', value: fixedTotal, color: 'var(--color-cat-7)' },
  ]
}

// The biggest variable expenses: fixed ones (rent...) would always top it and say nothing
function topVariable(expenses: readonly MonthExpense[]) {
  return expenses
    .filter((e) => !isFixed(e))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_COUNT)
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {hint && <span className={styles.hint}>{hint}</span>}
      </header>
      {children}
    </section>
  )
}
