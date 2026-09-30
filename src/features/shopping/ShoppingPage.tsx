import { House, ShoppingBasket } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Button, Card, EmptyState, PageHeader, SegmentedControl, Sheet, Stack } from '@/ui'
import { AddItemForm } from './components/AddItemForm'
import { FinishPurchaseForm } from './components/FinishPurchaseForm'
import { ItemList } from './components/ItemList'
import { PantryList } from './components/PantryList'
import styles from './ShoppingPage.module.css'
import { useShoppingList } from './useShoppingList'

type Tab = 'list' | 'pantry'

export function ShoppingPage() {
  const shopping = useShoppingList()
  // The tab lives in the URL so back and reload keep it
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'pantry' ? 'pantry' : 'list'
  const [isFinishing, setIsFinishing] = useState(false)

  if (!shopping) return null

  const { toBuy, inCart, pantry } = shopping
  const listCount = toBuy.length + inCart.length

  return (
    <Stack gap={5}>
      <PageHeader title="Compras" />

      <SegmentedControl
        label="Vista de compras"
        value={tab}
        onChange={(next) => setParams(next === 'list' ? {} : { tab: next }, { replace: true })}
        segments={[
          { value: 'list', label: 'Lista', count: listCount },
          { value: 'pantry', label: 'En casa', count: pantry.length },
        ]}
      />

      {tab === 'list' ? (
        <Stack gap={5} role="tabpanel" aria-label="Lista">
          <AddItemForm target="list" />

          {listCount === 0 ? (
            <EmptyState
              icon={<ShoppingBasket />}
              title="No te falta nada"
              description="Cuando algo se termine, marcalo en «En casa» y aparece acá."
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
        </Stack>
      ) : (
        <Stack gap={5} role="tabpanel" aria-label="En casa">
          <AddItemForm target="pantry" />

          {pantry.length === 0 ? (
            <EmptyState
              icon={<House />}
              title="Tu despensa está vacía"
              description="Lo que compres queda acá. Cuando se te acabe algo, tocá «Se acabó» y vuelve a la lista."
            />
          ) : (
            <Card padding="none">
              <PantryList items={pantry} />
            </Card>
          )}
        </Stack>
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
