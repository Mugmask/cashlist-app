import { useLiveQuery } from 'dexie-react-hooks'
import { EXPENSE_CATEGORIES, getMonthExpenses } from '@/features/expenses'
import { budgetsRepo } from './budgetsRepo'
import { buildBudgetOverview } from './overview'

const CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id)

// undefined while loading. Budgets and this month's expenses are read in one live query,
// so the overview updates when either changes.
export function useBudgetOverview() {
  return useLiveQuery(async () => {
    const [budgets, expenses] = await Promise.all([
      budgetsRepo.active(),
      getMonthExpenses(new Date()),
    ])
    return buildBudgetOverview(budgets, expenses, CATEGORY_IDS)
  })
}
