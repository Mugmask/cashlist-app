// One friendly sentence about the month's day-to-day spending against the month before:
// "En el día a día vas 12% abajo de agosto". `change` comes from variableChange; null (nothing
// to compare with) says nothing.
export function describeChange(
  change: number | null,
  previousMonthName: string,
  inProgress: boolean,
): string | null {
  if (change === null) return null
  const percent = Math.round(change * 100)
  const verb = inProgress ? 'vas' : 'fuiste'
  if (Math.abs(percent) < 3) return `En el día a día ${verb} parejo con ${previousMonthName}`
  const side = percent < 0 ? 'abajo' : 'arriba'
  return `En el día a día ${verb} ${Math.abs(percent)}% ${side} de ${previousMonthName}`
}
