import { Banknote, CreditCard } from 'lucide-react'

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash' as const, label: 'Efectivo / débito', icon: <Banknote aria-hidden /> },
  { value: 'card' as const, label: 'Tarjeta', icon: <CreditCard aria-hidden /> },
]
