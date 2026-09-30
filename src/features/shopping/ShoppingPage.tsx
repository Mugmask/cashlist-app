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
  const setTab = (next: Tab) => setParams(next === 'list' ? {} : { tab: next }, { replace: true })

  if (!shopping) return null

  const { toBuy, inCart, pantry } = shopping
  const listCount = toBuy.length + inCart.length

  return (
    <Stack gap={5}>
      <PageHeader title="Compras" />

      <SegmentedControl
        label="Vista de compras"
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'list', label: 'Lista', count: listCount },
          { value: 'pantry', label: 'En casa', count: pantry.length },
        ]}
      />

      {tab === 'list' ? (
        <Stack gap={5} role="tabpanel" aria-label="Lista">
          <AddItemForm target="list" />

          {listCount === 0 ? (
            pantry.length === 0 ? (
              // A brand-new user: explain how the list and the pantry work together
              <EmptyState
                icon={<ShoppingBasket />}
                title="Tu lista está vacía"
                description="Escribí lo que necesitás en «Agregar a la lista». Cuando termines la compra, queda en «En casa» para volver a pedirlo cuando se acabe."
              />
            ) : (
              <EmptyState
                icon={<ShoppingBasket />}
                title="No te falta nada"
                description="Cuando algo se termine, marcalo como «Se acabó» en «En casa» y vuelve a esta lista."
                action={
                  <Button variant="secondary" onClick={() => setTab('pantry')}>
                    Ir a En casa
                  </Button>
                }
              />
            )
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
              title="Todavía no hay nada en casa"
              description="Lo que compres aparece acá cuando termines la compra. También podés agregar lo que ya tenés en «Agregar a la despensa»."
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
