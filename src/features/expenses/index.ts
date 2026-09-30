// Public API of the feature: the rest of the app imports only from here
export { EXPENSE_CATEGORIES, getCategory, type ExpenseCategoryId } from './categories'
export { CategoryIcon } from './components/CategoryIcon'
export { ExpenseRow } from './components/ExpenseRow'
export { NewExpenseForm } from './components/NewExpenseForm'
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
