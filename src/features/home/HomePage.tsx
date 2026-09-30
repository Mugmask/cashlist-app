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
import { FixedHomeCard } from '@/features/fixed'
import { useProfile } from '@/features/profile'
import { ShoppingHomeCard } from '@/features/shopping'
import { Amount, Button, Card, EmptyState, ProgressBar, Stack, VisuallyHidden } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import styles from './HomePage.module.css'

const TOP_CATEGORIES = 4
const RECENT_COUNT = 5

export function HomePage() {
  const month = useMonthExpenses()
  const addExpense = useAddExpense()
  const income = useProfile()?.monthlyIncome
  const [openId, setOpenId] = useState<string | null>(null)

  if (!month) return null

  const { expenses, total, fixedTotal, variableTotal, dailyAverage } = month
  // Where the money goes, without fixed payments: rent would dwarf everything you can change
  const variableByCategory = totalsByCategory(expenses.filter((e) => !isFixed(e)))

  return (
    <Stack gap={6}>
      {/* The hero reads as the screen's title visually; this names it for screen readers */}
      <VisuallyHidden as="h1">Inicio</VisuallyHidden>
      <Card as="section" variant="hero" padding="lg" aria-label="Resumen del mes">
        <span className={styles.heroLabel}>Gastaste en {formatMonthName()}</span>
        <Amount value={total} size="xl" />
        {income !== undefined && <IncomeBar spent={total} income={income} />}
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
      <ShoppingHomeCard />

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Todavía no cargaste gastos este mes"
          description="Cargá tu primer gasto y mirá en qué se va la plata."
          action={
            <Button size="lg" icon={<Plus aria-hidden />} onClick={addExpense}>
              Cargar gasto
            </Button>
          }
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

// How much of the month's income is spent, once the profile has it
function IncomeBar({ spent, income }: { spent: number; income: number }) {
  const left = income - spent
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
    </div>
  )
}
