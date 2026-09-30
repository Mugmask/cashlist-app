import { ChartPie } from 'lucide-react'
import { EmptyState, PageHeader, Stack } from '@/ui'

// Placeholder until the budget feature lands
export function BudgetPage() {
  return (
    <Stack gap={6}>
      <PageHeader title="Presupuesto" />
      <EmptyState
        icon={<ChartPie />}
        title="Próximamente"
        description="Vas a poder ponerle un tope a cada categoría y ver cuánto te queda en el mes."
      />
    </Stack>
  )
}
