import type { ReactNode } from 'react'

// Matches product-card.tsx box dimensions exactly to prevent CLS.
export function ProductSkeletonCard(): ReactNode {
  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4" aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-md bg-muted" />
      <div className="min-h-[2.5rem] space-y-1.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-auto h-9 animate-pulse rounded-md bg-muted" />
    </article>
  )
}
