import { createContext, use } from 'react'

export type ShowToast = (message: string) => void

export const ToastContext = createContext<ShowToast | null>(null)

// Shows a short confirmation ("Gasto guardado"), also announced to screen readers
export function useToast() {
  const show = use(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
