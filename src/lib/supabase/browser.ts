'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Browser Supabase client using the public anon key — used for realtime subscriptions. */
export function getBrowserDb(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase public env is not configured.')
  }
  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}
