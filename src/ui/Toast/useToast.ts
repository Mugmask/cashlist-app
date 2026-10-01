import { createContext, use } from 'react'

// A button in the toast for taking the action back ("Deshacer")
export interface ToastAction {
  label: string
  onClick: () => void
}

export type ShowToast = (message: string, options?: { action?: ToastAction }) => void

export const ToastContext = createContext<ShowToast | null>(null)

// Shows a short confirmation ("Gasto guardado"), also announced to screen readers
export function useToast() {
  const show = use(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
