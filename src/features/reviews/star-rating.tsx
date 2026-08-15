import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  average: number
  /** Aggregate review count. Omit when showing a single review's own rating. */
  count?: number
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

// Read-only rating display. The stars are decorative; the aria-label carries the
// full, screen-reader-friendly summary.
export function StarRating({
  average,
  count,
  size = 'sm',
  showLabel = true,
  className,
}: StarRatingProps): ReactNode {
  const rounded = Math.round(average)
  const starSize = size === 'sm' ? 'size-3.5' : 'size-5'
  const hasCount = typeof count === 'number'

  const label =
    hasCount && count === 0
      ? 'No ratings yet'
      : hasCount
        ? `Rated ${average.toFixed(1)} out of 5, from ${count} review${count === 1 ? '' : 's'}`
        : `Rated ${average} out of 5`

  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label={label} title={label}>
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i < rounded ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30',
            )}
          />
        ))}
      </span>
      {showLabel && hasCount && (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {count === 0 ? 'No reviews yet' : `${average.toFixed(1)} (${count})`}
        </span>
      )}
    </div>
  )
}
