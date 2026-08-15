import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { getOrder } from '@/lib/server/order-store'
import { OrderSummary } from '@/features/checkout/order-summary'
import type { Address } from '@/lib/schemas/address-schema'

function fmtAddr(a: Address): string {
  return `${a.fullName}, ${a.line1}${a.line2 ? `, ${a.line2}` : ''}, ${a.city}, ${a.region} ${a.postalCode}, ${a.country}`
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  const session = await requireSession()
  if (!session) redirect(`/login?returnUrl=${encodeURIComponent(`/orders/${id}`)}`)

  const order = getOrder(id)
  if (!order || order.uid !== session.sub) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 rounded-md border border-green-500/40 bg-green-500/5 p-4">
        <h1 className="text-xl font-bold">Order confirmed 🎉</h1>
        <p className="text-sm text-muted-foreground">
          Order #{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      <ul className="mb-4 divide-y rounded-md border">
        {order.items.map((i) => (
          <li key={i.productId} className="flex justify-between p-3 text-sm">
            <span>
              {i.title} × {i.quantity}
            </span>
            <span>${((i.priceCents * i.quantity) / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <OrderSummary subtotalCents={order.totals.subtotalCents} />

      <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <section>
          <h2 className="font-semibold">Shipping</h2>
          <p className="text-muted-foreground">{fmtAddr(order.shipping)}</p>
        </section>
        <section>
          <h2 className="font-semibold">Payment</h2>
          <p className="text-muted-foreground">
            {order.payment.method === 'card' ? `Card ending ${order.payment.cardLast4}` : 'Cash on delivery'}
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Continue shopping
      </Link>
    </div>
  )
}
