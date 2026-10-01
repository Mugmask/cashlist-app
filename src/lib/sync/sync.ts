import { claimLocalData, db, SYNCED_ONCE_KEY } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { SYNCED_TABLES } from './tables'

let inFlight: Promise<void> | null = null

// The user a sync last finished for in this session, well or not (offline, an error):
// screens wait for the first one after signing in, but never forever. Per user, so someone
// signing in after a session that ended by itself (no sign-out) waits for their own.
let finishedFor: string | null = null
let syncingFor: string | null = null
const finishListeners = new Set<() => void>()

export function finishedForUser() {
  return finishedFor
}

export function onFinished(listener: () => void) {
  finishListeners.add(listener)
  return () => finishListeners.delete(listener)
}

function markFinished(userId: string | null) {
  if (finishedFor === userId) return
  finishedFor = userId
  for (const listener of finishListeners) listener()
}

// Signing out: the next sign-in waits for its own first sync again
export function resetFirstSync() {
  markFinished(null)
}

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
    if (syncingFor) markFinished(syncingFor)
    if (rerunRequested) {
      rerunRequested = false
      runSync().catch(() => {}) // errors surface on the next regular sync
    }
  })
  return inFlight
}

async function syncAll() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  syncingFor = data.session.user.id
  // Before anything else, offline too: another user's data on this device goes right away
  await claimLocalData(data.session.user.id)
  if (!navigator.onLine) return

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
  await db.syncState.put({ key: SYNCED_ONCE_KEY, value: new Date().toISOString() })
}
