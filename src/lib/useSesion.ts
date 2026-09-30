import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// undefined = todavía cargando, null = sin sesión
export function useSesion() {
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva))
    return () => data.subscription.unsubscribe()
  }, [])

  return sesion
}
