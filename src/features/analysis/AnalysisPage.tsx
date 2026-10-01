import { PieChart } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ExpenseDetailSheet,
  ExpenseRow,
  isFixed,
  useMonthExpenses,
  type MonthExpense,
} from '@/features/expenses'
import { useMonth } from '@/features/month'
import { Amount, Card, EmptyState, PageHeader, Stack } from '@/ui'
import { formatMonthName, shiftMonth } from '@/utils/dates'
import { changeByCategory, variableChange } from './comparison'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { TrendChart } from './components/TrendChart'
import { describeChange } from './insight'
import styles from './AnalysisPage.module.css'
import { useMonthTrend } from './useMonthTrend'

const TOP_COUNT = 5

// "En qué se va la plata": the month in depth, for the month picked in the header
export function AnalysisPage() {
  const { month: selected, current, isCurrent, select } = useMonth()
  const month = useMonthExpenses(selected)
  const previous = useMonthExpenses(shiftMonth(selected, -1))
  const trend = useMonthTrend(selected)
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

          {trend && (
            <Section title="Últimos meses">
              <Card>
                <TrendChart
                  points={trend}
                  selected={selected}
                  thisYear={current.getFullYear()}
                  onSelect={select}
                />
              </Card>
            </Section>
          )}

          <Section title="Cómo se reparte">
            <Card padding="none">
              <dl className={styles.split}>
                <SplitRow label="Variables" value={variableTotal} total={total} />
                <SplitRow label="Fijos" value={fixedTotal} total={total} />
                <SplitRow label="Con tarjeta" value={cardTotal} total={total} />
              </dl>
            </Card>
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

// The biggest variable expenses: fixed ones (rent...) would always top it and say nothing
function topVariable(expenses: readonly MonthExpense[]) {
  return expenses
    .filter((e) => !isFixed(e))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_COUNT)
}

// One part of the month: its share and amount, in a row that fits any phone
function SplitRow({ label, value, total }: { label: string; value: number; total: number }) {
  const share = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={styles.splitRow}>
      <dt>{label}</dt>
      <dd>
        <span className={styles.share}>{share}%</span>
        <Amount value={value} size="sm" compactFrom={10_000_000} />
      </dd>
    </div>
  )
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
