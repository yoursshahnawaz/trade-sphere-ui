import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import { CartPersistor } from './cart-persistor'
import { clearUser } from '@/features/auth/auth-slice'
import { addItem } from './cart-slice'
import type { CartLine } from '@/types'

const line: CartLine = {
  productId: 'p1',
  title: 'p1',
  priceCents: 1000,
  imageUrl: 'https://example.com/i.webp',
  stock: 10,
  quantity: 1,
}

describe('CartPersistor', () => {
  beforeEach(() => localStorage.clear())

  it('persists the guest cart to localStorage when unauthenticated', async () => {
    const store = makeStore()
    store.dispatch(clearUser()) // settle to 'unauthenticated'
    render(
      <Provider store={store}>
        <CartPersistor />
      </Provider>,
    )
    store.dispatch(addItem(line))
    await waitFor(() => {
      const raw = localStorage.getItem('ts-guest-cart')
      expect(JSON.parse(raw ?? '[]')).toHaveLength(1)
    })
  })
})
