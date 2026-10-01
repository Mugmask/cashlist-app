import { useCallback, useState, type ReactNode } from 'react'
import { IncomeForm } from '@/features/incomes'
import { SegmentedControl, Sheet, Stack, useToast } from '@/ui'
import { AddExpenseContext } from '../addExpense'
import { ExpenseForm } from './ExpenseForm'

type Kind = 'expense' | 'income'

const KINDS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const

const TITLE: Record<Kind, string> = { expense: 'Nuevo gasto', income: 'Nuevo ingreso' }

// Owns the "Nuevo gasto" sheet, so any screen can open it through useAddExpense(). It opens on
// an expense, the usual thing; one tap above the form switches it to an income.
export function AddExpenseProvider({
  initiallyOpen = false,
  children,
}: {
  initiallyOpen?: boolean
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const toast = useToast()
  const [kind, setKind] = useState<Kind>('expense')
  const open = useCallback(() => {
    setKind('expense')
    setIsOpen(true)
  }, [])
  const saved = (message: string) => {
    setIsOpen(false)
    toast(message)
  }

  return (
    <AddExpenseContext value={open}>
      {children}
      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title={TITLE[kind]}>
        <Stack gap={4}>
          <SegmentedControl label="Qué cargás" segments={KINDS} value={kind} onChange={setKind} />
          {kind === 'expense' ? (
            <ExpenseForm onSaved={() => saved('Gasto guardado')} />
          ) : (
            <IncomeForm onSaved={() => saved('Ingreso guardado')} />
          )}
        </Stack>
      </Sheet>
    </AddExpenseContext>
  )
}
