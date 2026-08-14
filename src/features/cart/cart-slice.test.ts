import { describe, it, expect } from 'vitest'
import reducer, {
  addItem,
  setQuantity,
  removeItem,
  setCart,
  clearCart,
  selectCartCount,
  selectSubtotalCents,
} from './cart-slice'
import { makeStore } from '@/store'
import type { CartLine } from '@/types'

const line = (productId: string, quantity: number, stock = 10): CartLine => ({
  productId,
  title: productId,
  priceCents: 1000,
  imageUrl: 'https://example.com/i.webp',
  stock,
  quantity,
})

describe('cartSlice reducers', () => {
  it('adds a new item', () => {
    const s = reducer(undefined, addItem(line('p1', 2)))
    expect(s.items).toHaveLength(1)
    expect(s.items[0]?.quantity).toBe(2)
  })

  it('increments an existing item, capped at stock', () => {
    let s = reducer(undefined, addItem(line('p1', 6, 8)))
    s = reducer(s, addItem(line('p1', 5, 8)))
    expect(s.items[0]?.quantity).toBe(8)
  })

  it('does not add a 0-stock item', () => {
    const s = reducer(undefined, addItem(line('p1', 1, 0)))
    expect(s.items).toHaveLength(0)
  })

  it('setQuantity clamps and removes at 0', () => {
    let s = reducer(undefined, addItem(line('p1', 2)))
    s = reducer(s, setQuantity({ productId: 'p1', quantity: 0 }))
    expect(s.items).toHaveLength(0)
  })

  it('removeItem / setCart / clearCart', () => {
    let s = reducer(undefined, setCart([line('p1', 1), line('p2', 2)]))
    s = reducer(s, removeItem('p1'))
    expect(s.items).toHaveLength(1)
    s = reducer(s, clearCart())
    expect(s.items).toHaveLength(0)
  })
})

describe('cart selectors', () => {
  it('count and subtotal', () => {
    const store = makeStore()
    store.dispatch(addItem(line('p1', 2)))
    store.dispatch(addItem(line('p2', 3)))
    expect(selectCartCount(store.getState())).toBe(5)
    expect(selectSubtotalCents(store.getState())).toBe(5000)
  })
})
