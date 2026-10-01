import { useState, type FormEvent } from 'react'
import { addExpense } from '@/features/expenses'
import { runSync } from '@/lib/sync'
import { AmountField, Button, Stack, useToast } from '@/ui'
import { parseAmount } from '@/utils/currency'
import { shoppingRepo } from '../shoppingRepo'
import styles from './FinishPurchaseForm.module.css'

export interface FinishPurchaseFormProps {
  itemCount: number
  onDone: () => void
}

// Closes the purchase: moves the cart to history and, optionally, records what it cost
export function FinishPurchaseForm({ itemCount, onDone }: FinishPurchaseFormProps) {
  const [amount, setAmount] = useState('')
  const toast = useToast()
  const [saving, setSaving] = useState(false) // guards against a double tap recording twice
  const isValid = parseAmount(amount) !== null
  const products = itemCount === 1 ? '1 producto' : `${itemCount} productos`

  async function finish(withExpense: boolean) {
    if (saving) return
    setSaving(true)
    const value = parseAmount(amount)
    if (withExpense && value !== null) {
      await addExpense({ amount: value, category: 'groceries', name: `Compra de ${products}` })
    }
    await shoppingRepo.finishPurchase()
    toast(withExpense ? 'Compra terminada y gasto cargado' : 'Compra terminada')
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isValid) finish(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <p className={styles.hint}>
          <strong>{products}</strong> pasan a «En casa».
        </p>
        <AmountField
          label="Total de la compra"
          value={amount}
          onValueChange={setAmount}
          autoFocus
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid} loading={saving}>
          Cargar gasto y terminar
        </Button>
        <Button variant="ghost" size="lg" fullWidth disabled={saving} onClick={() => finish(false)}>
          Terminar sin cargar gasto
        </Button>
      </Stack>
    </form>
  )
}
