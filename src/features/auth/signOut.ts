import { clearLocalData, countPendingChanges } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { resetFirstSync, runSync } from '@/lib/sync'

// Uploads what's left and tells how many changes still didn't make it (offline, say):
// signing out with any of them loses them, so the caller asks first
export async function unsyncedBeforeSignOut() {
  await runSync().catch(() => {})
  return countPendingChanges()
}

// Ends the session on this device only and forgets its data, so whoever signs in next
// starts empty. Nothing is lost: the next sign-in pulls everything back from Supabase.
// False when the session couldn't be ended: offline with an expired token, Supabase can't
// refresh it to sign out and keeps it. The data stays then, since the user is still in.
export async function signOut() {
  if (!supabase) return false
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error && (await supabase.auth.getSession()).data.session) return false
  await runSync().catch(() => {}) // waits out a sync already running, so it can't write after the clear
  await clearLocalData()
  resetFirstSync()
  return true
}
