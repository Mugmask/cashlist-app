// Public API of the feature: the rest of the app imports only from here
export { getCategory, useCategories } from './categories'
export { useAddExpense } from './addExpense'
export { AddExpenseProvider } from './components/AddExpenseProvider'
export { CategoryIcon } from './components/CategoryIcon'
export { CategoryPicker } from './components/CategoryPicker'
export { ConversionNote, ManualRateField } from './components/DollarConversion'
export { CURRENCY_OPTIONS } from './currencies'
export { ExpenseDetailSheet } from './components/ExpenseDetailSheet'
export { ExpenseForm } from './components/ExpenseForm'
export { ExpenseRow } from './components/ExpenseRow'
export {
  addExpense,
  getExpensesBefore,
  getExpensesSince,
  getPaymentsOf,
  getFixedInUseBy,
  getFixedPayments,
  removeExpense,
} from './expensesRepo'
// The screen loads when it's first opened, not with the app: see app/router.tsx
export const loadExpensesPage = () =>
  import('./ExpensesPage').then((m) => ({ Component: m.ExpensesPage }))
export {
  installmentsOf,
  MAX_INSTALLMENTS,
  type MonthExpense,
  splitInstallments,
} from './installments'
export { PAYMENT_METHOD_OPTIONS } from './paymentMethods'
export { ShareField } from './components/ShareField'
export { chargedOf, isValidPart, partOf, SHARE_CHIPS, shareOf, type ShareOption } from './shared'
export { firstTrackedPeriod, isFixed, totalsByCategory } from './selectors'
export { useMonthExpenses } from './useMonthExpenses'
