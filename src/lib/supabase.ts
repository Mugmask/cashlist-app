import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null while the env vars aren't set, so the app still boots
export const supabase = url && anonKey ? createClient(url, anonKey) : null
