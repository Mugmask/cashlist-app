import { Plus, ReceiptText } from 'lucide-react'
import { Amount, Button, EmptyState, PageHeader, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { capitalize } from '@/utils/text'
import { useAddExpense } from './addExpense'
import { ExpenseList } from './components/ExpenseList'
import { useMonthExpenses } from './useMonthExpenses'

export function ExpensesPage() {
  const month = useMonthExpenses()
  const addExpense = useAddExpense()

  if (!month) return null

  const { expenses, total } = month

  return (
    <Stack gap={6}>
      <PageHeader
        title="Gastos"
        subtitle={capitalize(formatMonthName())}
        action={<Amount value={total} size="lg" />}
      />
      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={`Todavía no hay gastos en ${formatMonthName()}`}
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
