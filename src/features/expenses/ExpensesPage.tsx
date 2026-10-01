import { Plus, ReceiptText } from 'lucide-react'
import { Amount, Button, EmptyState, PageHeader, Stack } from '@/ui'
import { useMonth } from '@/features/month'
import { formatMonthName } from '@/utils/dates'
import { useAddExpense } from './addExpense'
import { ExpenseList } from './components/ExpenseList'
import { useMonthExpenses } from './useMonthExpenses'

export function ExpensesPage() {
  const { month: selected } = useMonth()
  const month = useMonthExpenses(selected)
  const addExpense = useAddExpense()

  if (!month) return null

  const { expenses, total } = month

  return (
    <Stack gap={6}>
      <PageHeader title="Gastos" action={<Amount value={total} size="lg" />} />
      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={`No hay gastos en ${formatMonthName(selected)}`}
          description="Los gastos del mes aparecen acá, día por día."
          action={
            <Button size="lg" icon={<Plus aria-hidden />} onClick={addExpense}>
              Cargar gasto
            </Button>
          }
        />
      ) : (
        <ExpenseList expenses={expenses} />
      )}
    </Stack>
  )
}
