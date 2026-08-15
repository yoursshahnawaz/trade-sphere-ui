import type { ReactNode } from 'react'
import { Package, Truck, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered'

const STEPS = [
  { key: 'Processing', label: 'Processing', Icon: Package },
  { key: 'Shipped', label: 'Shipped', Icon: Truck },
  { key: 'Delivered', label: 'Delivered', Icon: PackageCheck },
] as const

export function OrderTimeline({ status }: { status: OrderStatus }): ReactNode {
  const current = STEPS.findIndex((s) => s.key === status)
  return (
    <ol className="flex items-start" aria-label={`Order status: ${status}`}>
      {STEPS.map((step, i) => {
        const done = i <= current
        return (
          <li key={step.key} className={cn('flex items-center', i < STEPS.length - 1 ? 'flex-1' : 'flex-none')}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-full ring-1 transition-colors',
                  done ? 'bg-primary text-primary-foreground ring-primary' : 'bg-muted text-muted-foreground ring-border',
                )}
              >
                <step.Icon className="size-5" />
              </span>
              <span className={cn('text-xs font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn('mx-2 mt-5 h-0.5 flex-1', i < current ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
