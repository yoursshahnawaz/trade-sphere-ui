import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

// Consistent, friendly empty state: soft icon chip, title, supporting line, and
// an optional call to action. Used wherever a list or result set comes back empty.
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps): ReactNode {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-7" />
      </span>
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
