import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { AccountView } from '@/features/account/account-view'

export const metadata: Metadata = { title: 'Your account' }

export default async function AccountPage(): Promise<ReactNode> {
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/account')
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your account</h1>
      <AccountView />
    </div>
  )
}
