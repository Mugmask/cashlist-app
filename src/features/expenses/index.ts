// Public API of the feature: the rest of the app imports only from here
export { EXPENSE_CATEGORIES, getCategory, type ExpenseCategoryId } from './categories'
export { useAddExpense } from './addExpense'
export { AddExpenseProvider } from './components/AddExpenseProvider'
export { CategoryIcon } from './components/CategoryIcon'
export { ExpenseRow } from './components/ExpenseRow'
export {
  addExpense,
  getFixedPayments,
  getMonthExpenses,
  removeExpense,
  type NewExpense,
} from './expensesRepo'
export { ExpensesPage } from './ExpensesPage'
export { isFixed, totalsByCategory } from './selectors'
export { useMonthExpenses } from './useMonthExpenses'
