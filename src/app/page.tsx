import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PromoCarousel } from '@/features/promo/promo-carousel'
import { CategoryRail } from '@/features/home/category-rail'
import { ProductRail } from '@/features/home/product-rail'
import { RecentlyViewed } from '@/features/home/recently-viewed'
import { listCategories, getTopRatedProducts, getOnSaleProducts } from '@/lib/server/product-store'

export default async function HomePage(): Promise<ReactNode> {
  const [categories, topRated, deals] = await Promise.all([
    listCategories(),
    getTopRatedProducts(4),
    getOnSaleProducts(4),
  ])

  return (
    <div className="pb-4">
      <h1 className="sr-only">Trade-Sphere marketplace</h1>
      <PromoCarousel />
      <CategoryRail categories={categories} />
      <RecentlyViewed />
      <ProductRail title="Top rated" products={topRated} seeAllHref="/products" seeAllLabel="Browse all" />
      <ProductRail title="Deals for you" products={deals} seeAllHref="/offers" seeAllLabel="All offers" />

      <section className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/products"
          className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">Browse the full marketplace</p>
            <p className="text-sm text-muted-foreground">
              Search and filter everything our sellers have listed.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            All products <ArrowRight className="size-4" />
          </span>
        </Link>
      </section>
    </div>
  )
}
