'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { setFirstVisit } from '@/store/ui-slice'

/** Marks a first-time visitor once (localStorage flag) for promo targeting. */
export function FirstVisitBootstrap(): null {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.localStorage.getItem('ts-visited')) {
      window.localStorage.setItem('ts-visited', '1')
      dispatch(setFirstVisit(true))
    }
  }, [dispatch])
  return null
}
