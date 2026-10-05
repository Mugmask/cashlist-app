import { Plus, ShoppingBasket } from 'lucide-react'
import { useRef, useState } from 'react'
import { runSync } from '@/lib/sync'
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  PageLoader,
  SegmentedControl,
  Sheet,
  Stack,
  usePrimaryAction,
} from '@/ui'
import { AddItemForm } from './components/AddItemForm'
import { FinishPurchaseForm } from './components/FinishPurchaseForm'
import { ItemList } from './components/ItemList'
import { KnownProductsSheet } from './components/KnownProductsSheet'
import { RecipeCards } from './components/RecipeCards'
import { RecipeSheet } from './components/RecipeSheet'
import { useRecipes } from './recipesRepo'
import styles from './ShoppingPage.module.css'
import { shoppingRepo } from './shoppingRepo'
import { useShoppingList } from './useShoppingList'

type Tab = 'list' | 'recipes'

// Two tabs. The list: type what's missing or tap a frequent one; in the store, tick what goes
// in the cart; at the checkout, finish the purchase and record what it cost. The recipes: cook
// one and what's missing from home goes on the list.
export function ShoppingPage() {
  const shopping = useShoppingList()
  const [tab, setTab] = useState<Tab>('list')
  const [isFinishing, setIsFinishing] = useState(false)
  const [isBrowsing, setIsBrowsing] = useState(false)
  const recipes = useRecipes()
  // The recipe open in its sheet: an id, 'new' for a new one, null when closed
  const [recipeSheet, setRecipeSheet] = useState<string | null>(null)
  // Adding here is typing into the field, so the + just takes you there (keyboard up)
  const addInputRef = useRef<HTMLInputElement>(null)
  // On the recipes tab, the + makes a new recipe
  usePrimaryAction(tab === 'list' ? 'Agregar a la lista' : 'Nueva receta', () => {
    if (tab === 'list') addInputRef.current?.focus()
    else setRecipeSheet('new')
  })

  if (!shopping || !recipes) return <PageLoader />

  const { toBuy, inCart, frequent, known } = shopping
  const listCount = toBuy.length + inCart.length
  const products = [...known, ...toBuy, ...inCart].map((i) => i.name)
  const pantry = known.map((i) => i.name)
  const openRecipe = recipes.find((r) => r.id === recipeSheet)

  async function addFrequent(id: string) {
    await shoppingRepo.addAgain(id)
    runSync().catch(() => {})
  }

  return (
    <Stack gap={5}>
      <PageHeader title="Compras" />

      <SegmentedControl
        label="Compras"
        segments={[
          { value: 'list', label: 'Lista', count: listCount || undefined },
          { value: 'recipes', label: 'Recetas', count: recipes.length || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'list' ? (
        <>
          <Stack gap={3}>
            <AddItemForm inputRef={addInputRef} />
            {/* One row that scrolls sideways, so the list stays close to the top */}
            {known.length > 0 && (
              <ul className={styles.chips} aria-label="Frecuentes">
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
            )}
          </Stack>

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
              {/* How many is on the tab already */}
              <h2 className={styles.sectionTitle}>Para comprar</h2>
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
        </>
      ) : (
        <section aria-label="Recetas">
          {recipes.length === 0 && (
            <p className={styles.hint}>
              Cargá lo que cocinás seguido: al elegirla, lo que te falte va directo a la lista.
            </p>
          )}
          <RecipeCards
            recipes={recipes}
            pantry={pantry}
            onOpen={setRecipeSheet}
            onCreate={() => setRecipeSheet('new')}
          />
        </section>
      )}

      <Sheet open={isFinishing} onClose={() => setIsFinishing(false)} title="Terminar compra">
        <FinishPurchaseForm items={inCart} onDone={() => setIsFinishing(false)} />
      </Sheet>
      <KnownProductsSheet open={isBrowsing} onClose={() => setIsBrowsing(false)} items={known} />
      <RecipeSheet
        open={recipeSheet !== null}
        recipe={openRecipe}
        products={products}
        pantry={pantry}
        onClose={() => setRecipeSheet(null)}
      />
    </Stack>
  )
}
