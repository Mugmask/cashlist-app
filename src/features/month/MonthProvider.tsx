import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { startOfMonth } from '@/utils/dates'
import { MonthContext, type MonthState } from './month'

// Holds the month being looked at. It starts (and a reload starts again) on this month.
// Today is read again whenever the app comes back to the screen and at midnight: a PWA left
// open in the background on the 30th is back on the 1st without a reload, and on the new
// month if it was showing the one that just ended.
export function MonthProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => new Date())
  // null: this month, whichever it is; a date: a month gone, picked in the header
  const [picked, setPicked] = useState<Date | null>(null)

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setToday(new Date())
    }
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
    const timer = setTimeout(refresh, midnight - now.getTime() + 1000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [today])

  const day = today.toDateString() // the day, not the second: memoized state changes once a day
  const state = useMemo<MonthState>(() => {
    const current = startOfMonth(new Date(day))
    const month = picked && picked < current ? picked : current
    return {
      month,
      current,
      today: new Date(day),
      isCurrent: month.getTime() === current.getTime(),
      // The future has nothing to show yet; this month (or later) follows today
      select: (next) => setPicked(startOfMonth(next) < current ? startOfMonth(next) : null),
    }
  }, [day, picked])

  return <MonthContext value={state}>{children}</MonthContext>
}
