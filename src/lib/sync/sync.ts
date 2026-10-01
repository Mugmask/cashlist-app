import { claimLocalData } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { SYNCED_TABLES } from './tables'

let inFlight: Promise<void> | null = null
let rerunRequested = false

// Never runs two syncs in parallel. A call during a running sync returns that one and
// schedules one more run right after, so a change notified mid-sync isn't missed.
export function runSync(): Promise<void> {
  if (inFlight) {
    rerunRequested = true
    return inFlight
  }
  inFlight = syncAll().finally(() => {
    inFlight = null
    if (rerunRequested) {
      rerunRequested = false
      runSync().catch(() => {}) // errors surface on the next regular sync
    }
  })
  return inFlight
}

async function syncAll() {
  if (!supabase || !navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  await claimLocalData(data.session.user.id)

  // A failing table doesn't stop the others; the first error is reported after all ran
  const errors: unknown[] = []
  for (const table of SYNCED_TABLES) {
    try {
      await table.run(supabase)
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length > 0) throw errors[0]
}
