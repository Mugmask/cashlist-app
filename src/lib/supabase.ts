import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null while the env vars aren't set: the app then runs in local mode (Vercel previews),
// with no account and no sync, its data only in this browser
export const supabase = url && anonKey ? createClient(url, anonKey) : null

// Owner of the local data in local mode, where there's no signed-in user
export const LOCAL_USER_ID = 'local'
