import { useState } from 'react'
import { ExpenseForm } from '@/features/expenses'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Button, Stack, useToast } from '@/ui'
import { describePurchase } from '../items'
import { shoppingRepo } from '../shoppingRepo'
import styles from './FinishPurchaseForm.module.css'

export interface FinishPurchaseFormProps {
  items: readonly ShoppingItem[] // what's in the cart
  onDone: () => void
}

// Closes the purchase. What it cost is an expense like any other (name, card, installments,
// dollars), already Súper and with the products as its note; or it closes without one.
export function FinishPurchaseForm({ items, onDone }: FinishPurchaseFormProps) {
  const toast = useToast()
  const [closing, setClosing] = useState(false) // guards against a double tap
  const products = items.length === 1 ? '1 producto' : `${items.length} productos`

  async function close(withExpense: boolean) {
    if (closing) return
    setClosing(true)
    await shoppingRepo.finishPurchase()
    toast(withExpense ? 'Compra terminada y gasto cargado' : 'Compra terminada')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  return (
    <Stack gap={4}>
      <p className={styles.hint}>
        <strong>{products}</strong> en el carrito. ¿Cuánto pagaste?
      </p>
      <ExpenseForm
        defaults={{ category: 'groceries', note: describePurchase(items) }}
        submitLabel="Cargar gasto y terminar"
        onSaved={() => close(true)}
      />
      <Button variant="ghost" size="lg" fullWidth disabled={closing} onClick={() => close(false)}>
        Terminar sin cargar gasto
      </Button>
    </Stack>
  )
}
