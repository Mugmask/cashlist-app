import { useMemo, useState, type ReactNode } from 'react'
import { PrimaryActionContext, type PrimaryAction } from './usePrimaryAction'

// Lets each screen decide what the app's main button does (see usePrimaryAction)
export function PrimaryActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<PrimaryAction | null>(null)
  const store = useMemo(() => ({ action, setAction }), [action])
  return <PrimaryActionContext value={store}>{children}</PrimaryActionContext>
}
