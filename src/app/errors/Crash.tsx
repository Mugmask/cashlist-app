// Dev-only route element that always throws, to check the error screen at /__crash
export function Crash(): never {
  throw new Error('Crash de prueba para ver la pantalla de error')
}
