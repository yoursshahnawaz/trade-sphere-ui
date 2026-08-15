import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { OnboardingWizard } from './onboarding-wizard'

function setup(): void {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OnboardingWizard />
    </QueryClientProvider>,
  )
}

describe('OnboardingWizard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks advancing past details when required fields are empty', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /continue to pricing/i }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument() // still on details
  })

  it('blocks advancing past pricing when the price is not positive', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Title'), 'Desk Mat')
    await screen.findByRole('option', { name: 'home' })
    await user.selectOptions(screen.getByLabelText('Category'), 'home')
    await user.click(screen.getByRole('button', { name: /continue to pricing/i }))

    await user.type(await screen.findByLabelText(/price/i), '0')
    await user.type(screen.getByLabelText(/stock/i), '5')
    await user.click(screen.getByRole('button', { name: /continue to images/i }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/drag & drop/i)).not.toBeInTheDocument() // still on pricing
  })

  it('completes all steps, posts the product, and navigates to inventory', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Title'), 'Desk Mat')
    await screen.findByRole('option', { name: 'home' })
    await user.selectOptions(screen.getByLabelText('Category'), 'home')
    await user.click(screen.getByRole('button', { name: /continue to pricing/i }))

    await user.type(await screen.findByLabelText(/price/i), '19.99')
    await user.type(screen.getByLabelText(/stock/i), '25')
    await user.click(screen.getByRole('button', { name: /continue to images/i }))

    await user.click(await screen.findByRole('button', { name: /publish product/i }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/seller/inventory'))
  })
})
