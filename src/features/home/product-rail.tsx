import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/types'
import { ProductCard } from '@/features/catalog/product-card'

export interface ProductRailProps {
  title: string
  products: Product[]
  seeAllHref?: string
  seeAllLabel?: string
}

// A titled row of product cards for the curated home. Renders nothing when empty
// so home never shows a bare heading.
export function ProductRail({ title, products, seeAllHref, seeAllLabel }: ProductRailProps): ReactNode {
  if (products.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {seeAllLabel ?? 'See all'} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
