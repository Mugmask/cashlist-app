import { ChefHat, Plus } from 'lucide-react'
import type { Recipe } from '@/lib/db'
import { Card } from '@/ui'
import { inPantry } from '../recipes'
import styles from './RecipeCards.module.css'

export interface RecipeCardsProps {
  recipes: readonly Recipe[]
  pantry: readonly string[] // names of what's at home, to tell what's missing
  onOpen: (id: string) => void
  onCreate: () => void
}

// The recipes as cards: what each takes and how much of it is missing; the first one makes a
// new recipe
export function RecipeCards({ recipes, pantry, onOpen, onCreate }: RecipeCardsProps) {
  return (
    <ul className={styles.grid}>
      {/* First, so it's at hand however many recipes there are */}
      <li>
        <button type="button" className={styles.create} onClick={onCreate}>
          <Plus aria-hidden />
          Nueva receta
        </button>
      </li>
      {recipes.map((recipe) => {
        const count = recipe.ingredients.length
        const missing = count - inPantry(recipe.ingredients, pantry).size
        return (
          <li key={recipe.id}>
            {/* The cards' glass, the whole of it the button */}
            <Card padding="none" className={styles.glass}>
              <button
                type="button"
                className={styles.card}
                onClick={() => onOpen(recipe.id)}
                aria-label={`Cocinar ${recipe.name}`}
              >
                <ChefHat aria-hidden className={styles.icon} />
                <span className={styles.name}>{recipe.name}</span>
                <span className={styles.meta}>
                  {count === 0
                    ? 'Sin ingredientes'
                    : `${count} ${count === 1 ? 'ingrediente' : 'ingredientes'}`}
                </span>
                {count > 0 && (
                  <>
                    <span className={styles.ingredients}>
                      {recipe.ingredients.map((i) => i.name).join(', ')}
                    </span>
                    <span className={missing === 0 ? styles.ready : styles.missing}>
                      {missing === 0
                        ? 'Tenés todo'
                        : missing === count
                          ? 'Falta todo'
                          : `${missing === 1 ? 'Falta' : 'Faltan'} ${missing}`}
                    </span>
                  </>
                )}
              </button>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
