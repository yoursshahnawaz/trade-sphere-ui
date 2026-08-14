import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./cart-api', () => ({ putCart: vi.fn(), getCart: vi.fn(), mergeCart: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { makeStore } from '@/store'
import { addToCart } from './cart-thunks'
import { addItem } from './cart-slice'
import { setUser } from '@/features/auth/auth-slice'
import { putCart } from './cart-api'
import type { CartLine } from '@/types'

const line = (id: string, quantity: number, stock = 10): CartLine => ({
  productId: id,
  title: id,
  priceCents: 1000,
  imageUrl: 'https://example.com/i.webp',
  stock,
  quantity,
})

describe('addToCart', () => {
  beforeEach(() => vi.clearAllMocks())

  it('guest add updates the cart without calling the server', async () => {
    const store = makeStore()
    await store.dispatch(addToCart(line('p1', 1)))
    expect(putCart).not.toHaveBeenCalled()
    expect(store.getState().cart.items).toHaveLength(1)
  })

  it('authenticated add rolls back only the failed line', async () => {
    const store = makeStore()
    store.dispatch(setUser({ uid: 'u1', role: 'buyer' })) // authenticated, no merge listener
    store.dispatch(addItem(line('p2', 2))) // pre-existing item must survive rollback
    vi.mocked(putCart).mockRejectedValueOnce(new Error('network'))

    await store.dispatch(addToCart(line('p1', 1)))

    const items = store.getState().cart.items
    expect(items.find((i) => i.productId === 'p1')).toBeUndefined() // rolled back
    expect(items.find((i) => i.productId === 'p2')?.quantity).toBe(2) // untouched
  })
})
