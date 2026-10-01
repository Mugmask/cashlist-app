import { Plus, ShoppingBasket } from 'lucide-react'
import { useRef, useState } from 'react'
import { runSync } from '@/lib/sync'
import { Button, Card, EmptyState, PageHeader, Sheet, Stack, usePrimaryAction } from '@/ui'
import { AddItemForm } from './components/AddItemForm'
import { FinishPurchaseForm } from './components/FinishPurchaseForm'
import { ItemList } from './components/ItemList'
import { KnownProductsSheet } from './components/KnownProductsSheet'
import styles from './ShoppingPage.module.css'
import { shoppingRepo } from './shoppingRepo'
import { useShoppingList } from './useShoppingList'

// One list: type what's missing or tap a frequent one; in the store, tick what goes in the
// cart; at the checkout, finish the purchase and record what it cost.
export function ShoppingPage() {
  const shopping = useShoppingList()
  const [isFinishing, setIsFinishing] = useState(false)
  const [isBrowsing, setIsBrowsing] = useState(false)
  // Adding here is typing into the field, so the + just takes you there (keyboard up)
  const addInputRef = useRef<HTMLInputElement>(null)
  usePrimaryAction('Agregar a la lista', () => addInputRef.current?.focus())

  if (!shopping) return null

  const { toBuy, inCart, frequent, known } = shopping
  const listCount = toBuy.length + inCart.length

  async function addFrequent(id: string) {
    await shoppingRepo.addAgain(id)
    runSync().catch(() => {})
  }

  return (
    <Stack gap={5}>
      <PageHeader title="Compras" />

      <AddItemForm inputRef={addInputRef} />

      {known.length > 0 && (
        <section aria-label="Frecuentes" className={styles.frequent}>
          <h2 className={styles.label}>Frecuentes</h2>
          <ul className={styles.chips}>
            {frequent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => addFrequent(item.id)}
                  aria-label={`Agregar ${item.name} a la lista`}
                >
                  <Plus aria-hidden />
                  {item.name}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className={styles.chip} onClick={() => setIsBrowsing(true)}>
                Todos…
              </button>
            </li>
          </ul>
        </section>
      )}

      {listCount === 0 ? (
        <EmptyState
          icon={<ShoppingBasket />}
          title="No te falta nada"
          description={
            known.length > 0
              ? 'Escribí arriba lo que necesitás o tocá un frecuente.'
              : 'Escribí arriba lo que necesitás.'
          }
        />
      ) : (
        <section aria-label="Para comprar">
          <h2 className={styles.sectionTitle}>
            Para comprar <span className={styles.count}>{listCount}</span>
          </h2>
          <Card padding="none">
            {/* What's missing first; what's already in the cart below, ticked */}
            <ItemList items={[...toBuy, ...inCart]} />
          </Card>
          {inCart.length > 0 && (
            <Button
              size="lg"
              fullWidth
              className={styles.finish}
              onClick={() => setIsFinishing(true)}
            >
              Terminar compra
            </Button>
          )}
        </section>
      )}

      <Sheet open={isFinishing} onClose={() => setIsFinishing(false)} title="Terminar compra">
        <FinishPurchaseForm items={inCart} onDone={() => setIsFinishing(false)} />
      </Sheet>
      <KnownProductsSheet open={isBrowsing} onClose={() => setIsBrowsing(false)} items={known} />
    </Stack>
  )
}
