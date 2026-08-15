'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Moves keyboard/screen-reader focus to the main landmark on client-side route
 * changes (App Router doesn't reset focus on navigation). Skips the initial mount.
 */
export function RouteFocus(): ReactNode {
  const pathname = usePathname()
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.getElementById('main-content')?.focus()
  }, [pathname])

  return null
}
