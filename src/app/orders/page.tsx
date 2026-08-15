import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import { requireSession } from '@/lib/server/http'
import { listOrdersByUid } from '@/lib/server/order-store'
import { formatINR } from '@/lib/money'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Your orders', description: 'Review your Trade-Sphere order history.' }

export default async function OrdersPage(): Promise<ReactNode> {
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/orders')

  const orders = await listOrdersByUid(session.sub)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it'll show up here so you can track it."
          action={
            <Link
              href="/"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              Start shopping
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-md border p-4 hover:bg-accent"
              >
                <div>
                  <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()} ·{' '}
                    {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                  </p>
                </div>
                <span className="font-semibold">{formatINR(o.totals.totalCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
