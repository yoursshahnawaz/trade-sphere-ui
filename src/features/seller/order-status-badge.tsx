import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/server/seller-orders'

const STYLES: Record<OrderStatus, string> = {
  Processing: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  Shipped: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  Delivered: 'bg-green-100 text-green-800 ring-green-600/20',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        STYLES[status],
      )}
    >
      {status}
    </span>
  )
}
