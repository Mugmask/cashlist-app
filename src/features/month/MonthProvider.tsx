import { useMemo, useState, type ReactNode } from 'react'
import { startOfMonth } from '@/utils/dates'
import { MonthContext, type MonthState } from './month'

// Holds the month being looked at. It starts (and a reload starts again) on this month.
export function MonthProvider({ children }: { children: ReactNode }) {
  const [current] = useState(() => startOfMonth(new Date()))
  const [month, setMonth] = useState(current)

  const state = useMemo<MonthState>(
    () => ({
      month,
      current,
      isCurrent: month.getTime() === current.getTime(),
      // The future has nothing to show yet
      select: (next) => setMonth(startOfMonth(next) > current ? current : startOfMonth(next)),
    }),
    [month, current],
  )

  return <MonthContext value={state}>{children}</MonthContext>
}
