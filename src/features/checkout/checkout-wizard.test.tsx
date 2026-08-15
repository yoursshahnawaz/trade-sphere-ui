import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { makeStore } from '@/store'
import { setCart } from '@/features/cart/cart-slice'
import { CheckoutWizard } from './checkout-wizard'
import type { CartLine } from '@/types'

const line: CartLine = {
  productId: 'p1',
  title: 'Headphones',
  priceCents: 3000,
  imageUrl: 'https://example.com/i.webp',
  stock: 8,
  quantity: 1,
}

function setup(): void {
  const store = makeStore()
  store.dispatch(setCart([line]))
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Provider store={store}>
        <CheckoutWizard />
      </Provider>
    </QueryClientProvider>,
  )
}

async function fillShipping(user: UserEvent): Promise<void> {
  await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Address line 1'), '12 MG Road')
  await user.type(screen.getByLabelText('City'), 'Bengaluru')
  await user.selectOptions(screen.getByLabelText('State'), 'Karnataka')
  await user.type(screen.getByLabelText('PIN code'), '560001')
  // Country is fixed to India — no selection needed.
}

async function fillCard(user: UserEvent): Promise<void> {
  await user.type(screen.getByLabelText('Name on card'), 'Ada Lovelace')
  await user.type(screen.getByLabelText('Card number'), '4242424242424242')
  await user.type(screen.getByLabelText(/Expiry/), '12/29')
  await user.type(screen.getByLabelText('CVC'), '123')
}

describe('CheckoutWizard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('completes the funnel and places an order', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue to shipping/i }))
    await fillShipping(user)
    await user.click(screen.getByRole('button', { name: /continue to billing/i }))
    await fillCard(user)
    await user.click(screen.getByRole('button', { name: /review order/i }))
    await user.click(await screen.findByRole('button', { name: /place order/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/orders/order-test'))
  })

  it('blocks advancing past shipping when the address is invalid', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue to shipping/i }))
    await user.click(screen.getByRole('button', { name: /continue to billing/i })) // submit empty
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument() // still on shipping
  })

  it('shows an error and does not navigate when the order fails', async () => {
    server.use(http.post('/api/orders', () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue to shipping/i }))
    await fillShipping(user)
    await user.click(screen.getByRole('button', { name: /continue to billing/i }))
    await fillCard(user)
    await user.click(screen.getByRole('button', { name: /review order/i }))
    await user.click(await screen.findByRole('button', { name: /place order/i }))
    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(push).not.toHaveBeenCalled()
  })
})
