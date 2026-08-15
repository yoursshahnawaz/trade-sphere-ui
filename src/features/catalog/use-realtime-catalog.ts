'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserDb } from '@/lib/supabase/browser'

// Subscribes the browser to `products` changes via the Supabase anon client so a
// buyer's catalog updates the moment a seller lists (or edits) a product — no
// refresh needed. On any change we invalidate the cached catalog queries, which
// refetches fresh data through the BFF (the anon client is used only as a signal).
export function useRealtimeCatalog(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    let db: SupabaseClient
    try {
      db = getBrowserDb()
    } catch {
      return // realtime is a progressive enhancement; catalog still works without it
    }

    const channel = db
      .channel('catalog-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: ['products'] })
          if (payload.eventType === 'INSERT') {
            // Deduped id collapses a burst of inserts into one gentle nudge.
            toast('New products just landed', { id: 'catalog-realtime' })
          }
        },
      )
      .subscribe()

    return () => {
      void db.removeChannel(channel)
    }
  }, [queryClient])
}
