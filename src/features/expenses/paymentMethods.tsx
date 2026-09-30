import { Banknote, CreditCard } from 'lucide-react'
import type { PaymentMethod } from '@/lib/db'

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash' as const, label: 'Efectivo / débito', icon: <Banknote aria-hidden /> },
  { value: 'card' as const, label: 'Tarjeta', icon: <CreditCard aria-hidden /> },
]

const STORAGE_KEY = 'cashlist:last-payment-method'

// The method used last on this device, so the usual one is preselected. A convenience only:
// storage may be unavailable (private mode), and then it's just cash.
export function readLastPaymentMethod(): PaymentMethod {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'card' ? 'card' : 'cash'
  } catch {
    return 'cash'
  }
}

export function rememberPaymentMethod(method: PaymentMethod) {
  try {
    localStorage.setItem(STORAGE_KEY, method)
  } catch {
    // not being able to remember it is harmless
  }
}
