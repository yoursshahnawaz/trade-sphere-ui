'use client'

import type { ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { selectCartItems, selectSubtotalCents } from '@/features/cart/cart-slice'
import { formatINR } from '@/lib/money'
import { OrderSummary } from './order-summary'

export interface CartReviewStepProps {
  onContinue: () => void
}

export function CartReviewStep({ onContinue }: CartReviewStepProps): ReactNode {
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectSubtotalCents)

  return (
    <div className="space-y-4">
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
        onClick={onContinue}
        disabled={items.length === 0}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        Continue to shipping
      </button>
    </div>
  )
}
