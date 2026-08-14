import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/features/auth/register-form'

export default function RegisterPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Shop across the Trade-Sphere marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
        {' · '}
        <Link href="/seller/register" className="font-medium underline">
          Sell on Trade-Sphere
        </Link>
      </p>
    </div>
  )
}
