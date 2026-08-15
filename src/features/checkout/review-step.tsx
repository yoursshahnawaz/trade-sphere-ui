'use client'

import type { ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectCartItems, selectSubtotalCents } from '@/features/cart/cart-slice'
import { formatINR } from '@/lib/money'
import { OrderSummary } from './order-summary'
import type { Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'

export interface ReviewStepProps {
  shipping: Address
  billing: Address
  payment: PaymentStored
  onPlaceOrder: () => void
  isPlacing: boolean
}

function fmtAddr(a: Address): string {
  return `${a.fullName}, ${a.line1}${a.line2 ? `, ${a.line2}` : ''}, ${a.city}, ${a.region} ${a.postalCode}, ${a.country}`
}

export function ReviewStep({ shipping, billing, payment, onPlaceOrder, isPlacing }: ReviewStepProps): ReactNode {
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectSubtotalCents)

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Shipping</h3>
        <p className="text-sm text-muted-foreground">{fmtAddr(shipping)}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold">Billing</h3>
        <p className="text-sm text-muted-foreground">{fmtAddr(billing)}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold">Payment</h3>
        <p className="text-sm text-muted-foreground">
          {payment.method === 'card' ? `Card ending ${payment.cardLast4}` : 'Cash on delivery'}
        </p>
      </section>
      <ul className="divide-y rounded-md border">
        {items.map((i) => (
          <li key={i.productId} className="flex justify-between p-3 text-sm">
            <span>
              {i.title} × {i.quantity}
            </span>
            <span>{formatINR(i.priceCents * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <OrderSummary subtotalCents={subtotal} />
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={isPlacing}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPlacing ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  )
}
