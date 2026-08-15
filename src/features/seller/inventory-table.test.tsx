import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: vi.fn() } }))

import { InventoryTable } from './inventory-table'

function setup(): void {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InventoryTable />
    </QueryClientProvider>,
  )
}

describe('InventoryTable', () => {
  it('renders the seeded products', async () => {
    setup()
    expect(await screen.findByText('Wireless Earbuds Pro')).toBeInTheDocument()
    expect(screen.getByText('Ergonomic Mouse')).toBeInTheDocument()
  })

  it('filters rows by search text', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Wireless Earbuds Pro')
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'mouse')
    await waitFor(() => expect(screen.queryByText('Wireless Earbuds Pro')).not.toBeInTheDocument())
    expect(screen.getByText('Ergonomic Mouse')).toBeInTheDocument()
  })

  it('filters by derived status text', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Studio Microphone')
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'draft')
    await waitFor(() => expect(screen.queryByText('Wireless Earbuds Pro')).not.toBeInTheDocument())
    expect(screen.getByText('Studio Microphone')).toBeInTheDocument()
  })

  it('toggles aria-sort when a sortable header is clicked', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Wireless Earbuds Pro')
    const header = screen.getByRole('columnheader', { name: /product/i })
    expect(header).toHaveAttribute('aria-sort', 'none')
    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })

  it('adds stock inline via the row restock control', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Ergonomic Mouse')
    const input = screen.getByLabelText(/add stock for ergonomic mouse/i)
    await user.type(input, '5')
    await user.click(within(input.closest('form') as HTMLElement).getByRole('button', { name: /add/i }))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/added 5/i)))
  })
})
