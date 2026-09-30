import { useCallback, useState, type ReactNode } from 'react'
import { Sheet, useToast } from '@/ui'
import { AddExpenseContext } from '../addExpense'
import { NewExpenseForm } from './NewExpenseForm'

// Owns the "Nuevo gasto" sheet, so any screen can open it through useAddExpense()
export function AddExpenseProvider({
  initiallyOpen = false,
  children,
}: {
  initiallyOpen?: boolean
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const toast = useToast()
  const open = useCallback(() => setIsOpen(true), [])

  return (
    <AddExpenseContext value={open}>
      {children}
      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Nuevo gasto">
        <NewExpenseForm
          onSaved={() => {
            setIsOpen(false)
            toast('Gasto guardado')
          }}
        />
      </Sheet>
    </AddExpenseContext>
  )
}
