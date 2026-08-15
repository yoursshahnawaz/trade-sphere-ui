import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { getSellerOrder } from '@/lib/server/seller-orders'
import { OrderStatusBadge } from '@/features/seller/order-status-badge'

const money = (c: number): string => `$${(c / 100).toFixed(2)}`

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/seller/orders')

  const order = getSellerOrder(session.sub, id)
  if (!order) notFound() // covers both missing and not-owned (ownership scoped by uid)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/seller/orders" className="text-sm underline">
        ← All orders
      </Link>
      <div className="mt-4 mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()} · {order.customer}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="mb-4 divide-y rounded-md border">
        {order.items.map((it, i) => (
          <li key={i} className="flex justify-between p-3 text-sm">
            <span>
              {it.title} × {it.quantity}
            </span>
            <span>{money(it.priceCents * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t pt-3 font-semibold">
        <span>Total</span>
        <span>{money(order.totalCents)}</span>
      </div>
    </div>
  )
}
