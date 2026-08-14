'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { setLoading, setUser, clearUser } from './auth-slice'
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
        if (d.user) dispatch(setUser(d.user))
        else dispatch(clearUser())
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
