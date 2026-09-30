import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { sincronizar } from './sync'

const INTERVALO_MS = 60_000

// Sincroniza al montar, cuando otro dispositivo cambia algo (Realtime), al volver la conexión,
// al volver a la app y cada minuto como respaldo
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

    // El aviso solo dispara la sincronización: los datos se bajan siempre por el mismo camino
    const canal = supabase
      ?.channel('gastos-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, correr)
      .subscribe()

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', correr)
      document.removeEventListener('visibilitychange', correr)
      if (canal) supabase?.removeChannel(canal)
    }
  }, [])

  return error
}
