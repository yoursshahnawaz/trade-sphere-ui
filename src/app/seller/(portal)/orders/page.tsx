import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { listSellerOrders } from '@/lib/server/seller-orders'
import { OrderStatusBadge } from '@/features/seller/order-status-badge'

const money = (c: number): string => `$${(c / 100).toFixed(2)}`

export const metadata: Metadata = { title: 'Orders' }

export default async function SellerOrdersPage(): Promise<ReactNode> {
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/seller/orders')
  const orders = listSellerOrders(session.sub)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet. Add a product to start selling.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Items</th>
                <th scope="col" className="px-4 py-3 font-medium">Total</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-foreground/5">
                  <td className="px-4 py-3">
                    <Link href={`/seller/orders/${o.id}`} className="font-medium underline">
                      #{o.id.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3">{o.items.reduce((n, it) => n + it.quantity, 0)}</td>
                  <td className="px-4 py-3">{money(o.totalCents)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
