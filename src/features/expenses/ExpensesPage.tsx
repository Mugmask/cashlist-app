import { ReceiptText } from 'lucide-react'
import { Amount, EmptyState, PageHeader, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { ExpenseList } from './components/ExpenseList'
import { useMonthExpenses } from './useMonthExpenses'

export function ExpensesPage() {
  const month = useMonthExpenses()

  if (!month) return null

  const { expenses, total } = month

  return (
    <Stack gap={6}>
      <PageHeader
        title="Movimientos"
        subtitle={<span>Gastos de {formatMonthName()}</span>}
        action={<Amount value={total} size="lg" />}
      />
      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title="Sin movimientos este mes"
          description="Tocá el + de abajo para cargar tu primer gasto."
        />
      ) : (
        <ExpenseList expenses={expenses} />
      )}
    </Stack>
  )
}
