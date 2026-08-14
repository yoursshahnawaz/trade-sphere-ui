import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SellerRegisterForm } from '@/features/auth/seller-register-form'

export default function SellerRegisterPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Start selling</CardTitle>
          <CardDescription>Create a seller account and open your storefront.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellerRegisterForm />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Just want to shop?{' '}
        <Link href="/register" className="font-medium underline">
          Create a buyer account
        </Link>
      </p>
    </div>
  )
}
