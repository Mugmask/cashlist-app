import { Plus, ReceiptText } from 'lucide-react'
import { Amount, Button, EmptyState, PageHeader, Stack } from '@/ui'
import { formatMonthName } from '@/utils/dates'
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
        subtitle={<span>Todo lo que gastaste en {formatMonthName()}</span>}
        action={<Amount value={total} size="lg" />}
      />
      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={`Todavía no hay gastos en ${formatMonthName()}`}
          description="Acá vas a ver cada gasto del mes, ordenado por día y con el total de cada uno."
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
