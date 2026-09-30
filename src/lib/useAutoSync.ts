import { useEffect, useState } from 'react'
import { sincronizar } from './sync'

const INTERVALO_MS = 60_000

// Sincroniza al montar, al volver la conexión, al volver a la app y cada minuto
export function useAutoSync() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const correr = () => {
      if (document.visibilityState !== 'visible') return
      sincronizar()
        .then(() => setError(null))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    }

    correr()
    const intervalo = setInterval(correr, INTERVALO_MS)
    window.addEventListener('online', correr)
    document.addEventListener('visibilitychange', correr)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', correr)
      document.removeEventListener('visibilitychange', correr)
    }
  }, [])

  return error
}
