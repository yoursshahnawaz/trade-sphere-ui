import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Server-side Supabase client using the service-role key (bypasses RLS).
 * Authorization is enforced in the BFF (per-uid scoping), as before. Lazily
 * created so importing this module never throws when env is absent (e.g. tests).
 */
export function getDb(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).')
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
