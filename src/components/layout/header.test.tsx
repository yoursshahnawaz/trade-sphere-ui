import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/features/auth/auth-client', () => ({ authClient: { logout: vi.fn() } }))

import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import { Header } from './header'
import { setUser } from '@/features/auth/auth-slice'

describe('Header account menu', () => {
  it('opens the account dropdown without crashing when authenticated', async () => {
    const store = makeStore()
    store.dispatch(setUser({ uid: 'u1', email: 'a@b.com', role: 'seller' }))
    render(
      <Provider store={store}>
        <Header />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'a@b.com' }))
    expect(await screen.findByText('Log out')).toBeInTheDocument()
  })
})
