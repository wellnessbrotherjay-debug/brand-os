import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Create a Supabase client with elevated privileges for server-side usage.
 * Service role keys must never be exposed to the browser.
 */
export const createAdminClient = (): SupabaseClient => {
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
  }

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  })
}
