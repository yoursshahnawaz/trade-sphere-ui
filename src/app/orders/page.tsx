import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { listOrdersByUid } from '@/lib/server/order-store'

export default async function OrdersPage(): Promise<ReactNode> {
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/orders')

  const orders = listOrdersByUid(session.sub)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          You have no orders yet.{' '}
          <Link href="/" className="underline">
            Start shopping
          </Link>
          .
        </p>
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
                <span className="font-semibold">${(o.totals.totalCents / 100).toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
