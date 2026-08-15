import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/server/http'
import { getSellerAnalytics, listSellerProducts } from '@/lib/server/seller-store'
import { countActiveOrders } from '@/lib/server/seller-orders'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RevenueChart } from '@/features/seller/revenue-chart'
import { TopProductsChart } from '@/features/seller/top-products-chart'

const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString()}`
const num = (n: number): string => n.toLocaleString()

export default async function SellerDashboardPage(): Promise<ReactNode> {
  const session = await requireSession()
  if (!session) redirect('/login?returnUrl=/seller') // defense-in-depth; proxy already gates this

  const { kpis, revenueSeries, topProducts } = getSellerAnalytics(session.sub)
  const productCount = listSellerProducts(session.sub).length
  const activeOrders = countActiveOrders(session.sub)

  const cards = [
    { label: 'Total sales', value: money(kpis.totalSalesCents) },
    { label: 'Active orders', value: num(activeOrders) },
    { label: 'Storefront traffic', value: num(kpis.traffic) },
    { label: 'Products listed', value: num(productCount) },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Seller dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} size="sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{c.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rev-heading" className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 id="rev-heading" className="mb-3 font-semibold">
            Revenue (last 12 months)
          </h2>
          <RevenueChart data={revenueSeries} />
        </section>
        <section aria-labelledby="top-heading" className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 id="top-heading" className="mb-3 font-semibold">
            Top products
          </h2>
          <TopProductsChart data={topProducts} />
        </section>
      </div>
    </div>
  )
}
