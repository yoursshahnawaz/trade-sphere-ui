'use client'

import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setCart } from './cart-slice'
import { loadGuestCart, saveGuestCart } from './cart-storage'

/**
 * Loads/persists the guest cart in localStorage. Gated strictly on the terminal
 * `unauthenticated` status (never `idle`/`loading`/`authenticated`) so an authed
 * reload can't load a guest cart or mirror the server cart back into guest storage.
 * Loads once, then persists on subsequent changes.
 */
export function CartPersistor(): null {
  const status = useAppSelector((s) => s.auth.status)
  const items = useAppSelector((s) => s.cart.items)
  const dispatch = useAppDispatch()
  const loaded = useRef(false)

  useEffect(() => {
    if (status !== 'unauthenticated') return
    if (!loaded.current) {
      loaded.current = true
      dispatch(setCart(loadGuestCart()))
      return // don't persist on the load pass
    }
    saveGuestCart(items)
  }, [items, status, dispatch])

  return null
}
