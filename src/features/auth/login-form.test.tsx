import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { push, refresh, login, loginWithGoogle } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(''),
}))
vi.mock('@/features/auth/auth-client', () => ({ authClient: { login, loginWithGoogle } }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import { LoginForm } from './login-form'

function renderForm() {
  return render(
    <Provider store={makeStore()}>
      <LoginForm />
    </Provider>,
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in a buyer and redirects home', async () => {
    login.mockResolvedValue({ uid: 'u1', email: 'a@b.com', role: 'buyer' })
    renderForm()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret1')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(login).toHaveBeenCalledWith('a@b.com', 'secret1')
    expect(push).toHaveBeenCalledWith('/')
  })

  it('shows an accessible error on failure', async () => {
    login.mockRejectedValue({ code: 'auth/invalid-credential' })
    renderForm()
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpw')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
    expect(push).not.toHaveBeenCalled()
  })
})
