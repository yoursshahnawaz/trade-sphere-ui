import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { EditProductForm } from './edit-product-form'

function setup(id: string): void {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EditProductForm id={id} />
    </QueryClientProvider>,
  )
}

describe('EditProductForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the product and saves changes', async () => {
    const user = userEvent.setup()
    setup('sp1') // present in the MSW seed
    expect(await screen.findByLabelText('Title')).toHaveValue('Wireless Earbuds Pro')
    await user.clear(screen.getByLabelText(/^Price/))
    await user.type(screen.getByLabelText(/^Price/), '59.99')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/seller/inventory'))
  })

  it('blocks a sale price that is not below the regular price', async () => {
    const user = userEvent.setup()
    setup('sp1')
    await screen.findByLabelText('Title')
    await user.clear(screen.getByLabelText(/^Price/))
    await user.type(screen.getByLabelText(/^Price/), '50')
    await user.type(screen.getByLabelText(/offer/i), '60')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(push).not.toHaveBeenCalled()
  })
})
