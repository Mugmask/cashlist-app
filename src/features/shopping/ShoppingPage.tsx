import { ShoppingBasket } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Card, EmptyState, PageHeader, Sheet, Stack } from '@/ui'
import { AddItemForm } from './components/AddItemForm'
import { BuyAgain } from './components/BuyAgain'
import { FinishPurchaseForm } from './components/FinishPurchaseForm'
import { ItemList } from './components/ItemList'
import styles from './ShoppingPage.module.css'
import { useShoppingList } from './useShoppingList'

export function ShoppingPage() {
  const list = useShoppingList()
  const [isFinishing, setIsFinishing] = useState(false)

  if (!list) return null

  const { toBuy, inCart, suggestions } = list
  const isEmpty = toBuy.length === 0 && inCart.length === 0

  return (
    <Stack gap={6}>
      <PageHeader
        title="Compras"
        subtitle={
          isEmpty
            ? 'Tu lista está vacía'
            : `${toBuy.length} para comprar · ${inCart.length} en el carrito`
        }
      />

      <AddItemForm />

      {suggestions.length > 0 && <BuyAgain suggestions={suggestions} />}

      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBasket />}
          title="Nada para comprar"
          description="Agregá lo que necesitás. En el súper, tocá cada producto para pasarlo al carrito."
        />
      ) : (
        <>
          {toBuy.length > 0 && (
            <Section title="Para comprar" count={toBuy.length}>
              <Card padding="none">
                <ItemList items={toBuy} />
              </Card>
            </Section>
          )}

          {inCart.length > 0 && (
            <Section title="En el carrito" count={inCart.length}>
              <Card padding="none">
                <ItemList items={inCart} />
              </Card>
              <Button
                size="lg"
                fullWidth
                className={styles.finish}
                onClick={() => setIsFinishing(true)}
              >
                Terminar compra
              </Button>
            </Section>
          )}
        </>
      )}

      <Sheet open={isFinishing} onClose={() => setIsFinishing(false)} title="Terminar compra">
        <FinishPurchaseForm itemCount={inCart.length} onDone={() => setIsFinishing(false)} />
      </Sheet>
    </Stack>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <section aria-label={title}>
      <h2 className={styles.sectionTitle}>
        {title} <span className={styles.count}>{count}</span>
      </h2>
      {children}
    </section>
  )
}
