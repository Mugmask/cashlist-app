import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null mientras no estén configuradas las env vars, para que la app levante igual
export const supabase = url && anonKey ? createClient(url, anonKey) : null
