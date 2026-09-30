import { Plus } from 'lucide-react'
import { runSync } from '@/lib/sync'
import type { Suggestion } from '../items'
import { shoppingRepo } from '../shoppingRepo'
import styles from './BuyAgain.module.css'

// One-tap chips for products bought before
export function BuyAgain({ suggestions }: { suggestions: readonly Suggestion[] }) {
  async function handleAdd(name: string) {
    await shoppingRepo.add({ name, quantity: 1 })
    runSync().catch(() => {})
  }

  return (
    <section aria-label="Volver a comprar">
      <h2 className={styles.title}>Volver a comprar</h2>
      <div className={styles.chips}>
        {suggestions.map(({ name }) => (
          <button
            key={name}
            type="button"
            className={styles.chip}
            onClick={() => handleAdd(name)}
            aria-label={`Agregar ${name}`}
          >
            <Plus aria-hidden />
            {name}
          </button>
        ))}
      </div>
    </section>
  )
}
