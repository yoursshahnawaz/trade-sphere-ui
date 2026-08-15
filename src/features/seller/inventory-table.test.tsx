import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
})
