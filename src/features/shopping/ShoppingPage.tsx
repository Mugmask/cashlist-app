import { ShoppingBasket } from 'lucide-react'
import { EmptyState, PageHeader, Stack } from '@/ui'

// Placeholder until the shopping list feature lands
export function ShoppingPage() {
  return (
    <Stack gap={6}>
      <PageHeader title="Compras" />
      <EmptyState
        icon={<ShoppingBasket />}
        title="Próximamente"
        description="Vas a armar el plan de comidas de la semana y la lista de compras sale sola."
      />
    </Stack>
  )
}
