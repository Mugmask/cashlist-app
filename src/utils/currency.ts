const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// "$ 12.500,00"
export function formatCurrency(amount: number) {
  return ars.format(amount)
}

// Accepts "1500", "1500,50" or "1500.50"; returns null if it isn't a valid amount
export function parseAmount(text: string) {
  const value = Number(text.trim().replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : null
}
