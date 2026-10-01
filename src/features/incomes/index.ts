// Public API of the feature: the rest of the app imports only from here
export { IncomeForm } from './components/IncomeForm'
export { getIncomesBefore, useMonthIncomes } from './incomesRepo'
// The screen loads when it's first opened, not with the app: see app/router.tsx
export const loadIncomesPage = () =>
  import('./IncomesPage').then((m) => ({ Component: m.IncomesPage }))
