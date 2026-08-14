import { describe, it, expect, beforeEach } from 'vitest'
import { loadGuestCart, saveGuestCart, clearGuestCart } from './cart-storage'
import type { CartLine } from '@/types'

const line: CartLine = {
  productId: 'p1',
  title: 'p1',
  priceCents: 1000,
  imageUrl: 'https://example.com/i.webp',
  stock: 10,
  quantity: 2,
}

describe('cart-storage', () => {
  beforeEach(() => localStorage.clear())

  it('saves and loads a guest cart', () => {
    saveGuestCart([line])
    expect(loadGuestCart()).toHaveLength(1)
  })

  it('returns [] for corrupt data', () => {
    localStorage.setItem('ts-guest-cart', 'not-json')
    expect(loadGuestCart()).toEqual([])
  })

  it('clears the guest cart', () => {
    saveGuestCart([line])
    clearGuestCart()
    expect(loadGuestCart()).toEqual([])
  })
})
