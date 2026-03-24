import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Check if environment variables are available - allow empty for local testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'local-testing-key';

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn('Using local testing mode for Supabase - some features may be limited');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

export type SupabaseClient = typeof supabase;
