'use client'

import { useEffect } from 'react'
import { recordRecentlyViewed } from '@/features/home/recently-viewed-storage'

// Mounted on the product detail page to record the view (client-side only).
export function RecordRecentlyViewed({ id }: { id: string }): null {
  useEffect(() => {
    recordRecentlyViewed(id)
  }, [id])
  return null
}
