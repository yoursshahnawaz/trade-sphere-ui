import type { ReactNode } from 'react'
import { computeTotals } from '@/lib/order-totals'

export interface OrderSummaryProps {
  subtotalCents: number
}

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function OrderSummary({ subtotalCents }: OrderSummaryProps): ReactNode {
  const t = computeTotals(subtotalCents)
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{fmt(t.subtotalCents)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Tax</dt>
        <dd>{fmt(t.taxCents)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd>{t.shippingCents === 0 ? 'Free' : fmt(t.shippingCents)}</dd>
      </div>
      <div className="flex justify-between border-t pt-1 font-semibold" aria-live="polite">
        <dt>Total</dt>
        <dd>{fmt(t.totalCents)}</dd>
      </div>
    </dl>
  )
}
