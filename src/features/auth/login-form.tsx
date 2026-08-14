'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store/hooks'
import { setUser } from '@/features/auth/auth-slice'
import { authClient } from '@/features/auth/auth-client'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth-schema'
import { safeReturnUrl } from '@/features/auth/safe-return-url'
import { getAuthErrorMessage } from '@/features/auth/auth-errors'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import type { SessionUser } from '@/types'

export function LoginForm(): ReactNode {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const [formError, setFormError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const returnUrl = useSearchParams().get('returnUrl')

  function redirectAfterAuth(user: SessionUser): void {
    router.push(returnUrl ? safeReturnUrl(returnUrl) : user.role === 'seller' ? '/seller' : '/')
    router.refresh()
  }

  function handleError(e: unknown): void {
    const msg = getAuthErrorMessage(e)
    setFormError(msg)
    toast.error(msg)
  }

  async function onSubmit(values: LoginInput): Promise<void> {
    setFormError(null)
    try {
      const user = await authClient.login(values.email, values.password)
      dispatch(setUser(user))
      redirectAfterAuth(user)
    } catch (e) {
      handleError(e)
    }
  }

  async function onGoogle(): Promise<void> {
    setFormError(null)
    try {
      const user = await authClient.loginWithGoogle()
      dispatch(setUser(user))
      redirectAfterAuth(user)
    } catch (e) {
      handleError(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        <FieldError name="email" message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        <FieldError name="password" message={errors.password?.message} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in…' : 'Log in'}
      </button>
      <button
        type="button"
        onClick={onGoogle}
        className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        Continue with Google
      </button>
    </form>
  )
}
