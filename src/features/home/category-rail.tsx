import type { ReactNode } from 'react'
import Link from 'next/link'

// Category shortcuts → the full catalog filtered by that category.
export function CategoryRail({ categories }: { categories: string[] }): ReactNode {
  if (categories.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">Shop by category</h2>
      {/* Single row: scrolls horizontally on small screens instead of wrapping. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Link
            key={c}
            href={`/products?category=${encodeURIComponent(c)}`}
            className="shrink-0 whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm font-medium capitalize shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            {c}
          </Link>
        ))}
      </div>
    </section>
  )
}
