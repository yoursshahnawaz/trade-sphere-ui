import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ProductStatus } from '@/lib/seller-status'

const STYLES: Record<ProductStatus, string> = {
  'In Stock': 'bg-green-100 text-green-800 ring-green-600/20',
  'Low Stock': 'bg-amber-100 text-amber-800 ring-amber-600/20',
  'Out of Stock': 'bg-red-100 text-red-800 ring-red-600/20',
  Draft: 'bg-muted text-muted-foreground ring-foreground/15',
}

export function StatusBadge({ status }: { status: ProductStatus }): ReactNode {
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
