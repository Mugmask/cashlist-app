import { createContext, use } from 'react'

export interface MonthState {
  month: Date // first day of the month being looked at
  current: Date // first day of this month
  today: Date // the start of today; changes when a new day is noticed
  isCurrent: boolean // `month` is this month: the only one that's still going
  select: (month: Date) => void // any month up to this one
}

export const MonthContext = createContext<MonthState | null>(null)

// The month the screens show. Shared, so going from Inicio to Gastos stays on the same month.
export function useMonth() {
  const state = use(MonthContext)
  if (!state) throw new Error('useMonth must be used inside <MonthProvider>')
  return state
}
