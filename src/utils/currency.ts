const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// "$ 12.500,00"
export function formatCurrency(amount: number) {
  return ars.format(amount)
}

// "$ 12.500,00" → { whole: "$ 12.500", fraction: ",00" }, so the cents can be styled apart
export function splitCurrency(amount: number) {
  const parts = ars.formatToParts(amount)
  const decimalIndex = parts.findIndex((p) => p.type === 'decimal')
  const cut = decimalIndex === -1 ? parts.length : decimalIndex
  const join = (list: Intl.NumberFormatPart[]) => list.map((p) => p.value).join('')
  return { whole: join(parts.slice(0, cut)), fraction: join(parts.slice(cut)) }
}

// Accepts "1500", "1500,50" or "1500.50"; returns null if it isn't a valid amount
export function parseAmount(text: string) {
  const value = Number(text.trim().replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? value : null
}
