import type { ReactNode } from 'react'
import { computeTotals } from '@/lib/order-totals'
import { formatINR } from '@/lib/money'

export interface OrderSummaryProps {
  subtotalCents: number
}

export function OrderSummary({ subtotalCents }: OrderSummaryProps): ReactNode {
  const t = computeTotals(subtotalCents)
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{formatINR(t.subtotalCents)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">GST (18%)</dt>
        <dd>{formatINR(t.taxCents)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd>{t.shippingCents === 0 ? 'Free' : formatINR(t.shippingCents)}</dd>
      </div>
      <div className="flex justify-between border-t pt-1 font-semibold" aria-live="polite">
        <dt>Total</dt>
        <dd>{formatINR(t.totalCents)}</dd>
      </div>
    </dl>
  )
}
