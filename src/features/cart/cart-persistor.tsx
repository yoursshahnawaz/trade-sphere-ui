'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setCart } from './cart-slice'
import { loadGuestCart, saveGuestCart } from './cart-storage'

/**
 * Loads/persists the guest cart in localStorage. Gated strictly on the terminal
 * `unauthenticated` status (never `idle`/`loading`/`authenticated`) so an authed
 * reload can't load a guest cart or mirror the server cart back into guest storage.
 */
export function CartPersistor(): null {
  const status = useAppSelector((s) => s.auth.status)
  const items = useAppSelector((s) => s.cart.items)
  const dispatch = useAppDispatch()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (hydrated || status !== 'unauthenticated') return
    dispatch(setCart(loadGuestCart()))
    setHydrated(true)
  }, [status, hydrated, dispatch])

  useEffect(() => {
    if (!hydrated || status !== 'unauthenticated') return
    saveGuestCart(items)
  }, [items, status, hydrated])

  return null
}
