import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// NOTE: Keep the service role key secret. Do NOT expose it to the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient<Database>(url, anonKey)

// Server client using service role - ONLY use this on server-side code (API routes)
export function getServerSupabaseClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment')
  }
  return createClient<Database>(url, serviceRoleKey)
}

export default supabase
