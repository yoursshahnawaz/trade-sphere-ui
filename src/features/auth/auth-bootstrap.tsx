'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { setLoading, setUser, clearUser } from './auth-slice'
import { loadServerCart } from '@/features/cart/cart-thunks'
import type { SessionUser } from '@/types'

/** Hydrates the auth slice from the HttpOnly session cookie via /api/auth/me. */
export function AuthBootstrap(): null {
  const dispatch = useAppDispatch()
  useEffect(() => {
    let active = true
    dispatch(setLoading())
    fetch('/api/auth/me')
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((d) => {
        if (!active) return
        if (d.user) {
          dispatch(setUser(d.user))
          void dispatch(loadServerCart())
        } else {
          dispatch(clearUser())
        }
      })
      .catch(() => {
        if (active) dispatch(clearUser())
      })
    return () => {
      active = false
    }
  }, [dispatch])
  return null
}
