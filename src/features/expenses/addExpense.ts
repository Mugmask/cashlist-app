import { createContext, use } from 'react'

export const AddExpenseContext = createContext<(() => void) | null>(null)

// Opens the "Nuevo gasto" sheet from anywhere: the bottom nav's +, an empty state...
export function useAddExpense() {
  const open = use(AddExpenseContext)
  if (!open) throw new Error('useAddExpense must be used inside <AddExpenseProvider>')
  return open
}
