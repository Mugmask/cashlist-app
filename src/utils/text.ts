// Key to detect the same text regardless of case, accents and spacing ("Azúcar " = "azucar")
export function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1)
}
