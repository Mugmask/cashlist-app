import { ChartPie } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { getCategory } from '@/features/expenses'
import { Card, EmptyState, PageHeader, Sheet, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { BudgetForm } from './components/BudgetForm'
import { BudgetLineList, UnbudgetedList } from './components/BudgetList'
import { BudgetSummary } from './components/BudgetSummary'
import styles from './BudgetPage.module.css'
import { useBudgetOverview } from './useBudgetOverview'

export function BudgetPage() {
  const overview = useBudgetOverview()
  const [editing, setEditing] = useState<string | null>(null)

  if (!overview) return null

  const { lines, unbudgeted, totals } = overview
  const editingLine = lines.find((l) => l.category === editing)
  const editingSpent =
    editingLine?.spent ?? unbudgeted.find((u) => u.category === editing)?.spent ?? 0

  return (
    <Stack gap={6}>
      <PageHeader title="Presupuesto" subtitle={`Tu mes de ${formatMonthName()}`} />

      {lines.length > 0 ? (
        <>
          <BudgetSummary totals={totals} />
          <Section title="Por categoría">
            <Card padding="none">
              <BudgetLineList lines={lines} onSelect={setEditing} />
            </Card>
          </Section>
        </>
      ) : (
        <EmptyState
          icon={<ChartPie />}
          title="Armá tu presupuesto"
          description="Ponele un tope mensual a cada categoría y mirá cuánto te queda. Elegí una para arrancar."
        />
      )}

      {unbudgeted.length > 0 && (
        <Section title={lines.length > 0 ? 'Sin presupuesto' : 'Categorías'}>
          <Card padding="none">
            <UnbudgetedList categories={unbudgeted} onSelect={setEditing} />
          </Card>
        </Section>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Presupuesto · ${getCategory(editing).label}` : ''}
      >
        {editing && (
          <BudgetForm
            category={editing}
            currentLimit={editingLine?.limit}
            spent={editingSpent}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
