import { Suspense, type ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/login-form'

export const metadata: Metadata = { title: 'Log in', description: 'Sign in to your Trade-Sphere account.' }

export default function LoginPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-12">
      <h1 className="sr-only">Log in</h1>
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back to Trade-Sphere.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
