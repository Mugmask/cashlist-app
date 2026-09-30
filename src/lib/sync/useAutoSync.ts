import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { syncErrorMessage } from '@/utils/errors'
import { runSync } from './sync'
import { SYNCED_TABLES } from './tables'

const INTERVAL_MS = 60_000

// Syncs on mount, when another device changes something (Realtime), when the connection
// comes back, when the app becomes visible, and every minute as a fallback
export function useAutoSync() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = () => {
      if (document.visibilityState !== 'visible') return
      runSync()
        .then(() => setError(null))
        .catch((e: unknown) => {
          console.error('Sync failed', e) // the raw error, for debugging
          setError(syncErrorMessage(e))
        })
    }

    run()
    const interval = setInterval(run, INTERVAL_MS)
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', run)

    // The notification only triggers a sync: data always comes down through the same path
    const channel = supabase?.channel('synced-tables-changes')
    for (const { name } of SYNCED_TABLES) {
      channel?.on('postgres_changes', { event: '*', schema: 'public', table: name }, run)
    }
    channel?.subscribe()

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', run)
      if (channel) supabase?.removeChannel(channel)
    }
  }, [])

  return error
}
