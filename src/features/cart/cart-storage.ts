import { cartLinesSchema } from '@/lib/schemas/cart-schema'
import type { CartLine } from '@/types'

const KEY = 'ts-guest-cart'

export function loadGuestCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = cartLinesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return [] // corrupt/unavailable storage → empty guest cart
  }
}

export function saveGuestCart(items: CartLine[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* storage full/unavailable — non-fatal */
  }
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* non-fatal */
  }
}
