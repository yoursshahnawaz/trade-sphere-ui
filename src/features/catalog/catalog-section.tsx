'use client'

import { useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/error-boundary'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { useDebouncedValue } from './use-debounced-value'
import { useProducts, type CatalogFilters } from './use-products'
import { useInfiniteScroll } from './use-infinite-scroll'
import { ProductCard } from './product-card'
import { ProductSkeletonCard } from './product-skeleton-card'
import { SearchBar } from './search-bar'
import { CatalogFilterBar } from './catalog-filters'

export function CatalogSection(): ReactNode {
  // Category is URL-driven so promo deep-links (?category=…) reactively filter.
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const setCategory = (value: string | null): void => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('category', value)
    else params.delete('category')
    const qs = params.toString()
    router.replace(qs ? `/?${qs}` : '/', { scroll: false })
  }

  const [q, setQ] = useState('')
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [inStock, setInStock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeCount =
    (category ? 1 : 0) + (minPrice != null ? 1 : 0) + (maxPrice != null ? 1 : 0) + (inStock ? 1 : 0)
  function clearFilters(): void {
    setCategory(null)
    setMinPrice(null)
    setMaxPrice(null)
    setInStock(false)
  }

  const debouncedQ = useDebouncedValue(q, 300)
  const filters: CatalogFilters = { q: debouncedQ, category, minPrice, maxPrice, inStock }

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPlaceholderData,
  } = useProducts(filters)

  const setSentinel = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    enabled: !isPlaceholderData,
    fetchNextPage: () => void fetchNextPage(),
  })

  const items = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <SearchBar value={q} onChange={setQ} />
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <CatalogFilterBar
              category={category}
              onCategory={setCategory}
              minPrice={minPrice}
              onMinPrice={setMinPrice}
              maxPrice={maxPrice}
              onMaxPrice={setMaxPrice}
              inStock={inStock}
              onInStock={setInStock}
            />
          </div>
          <SheetFooter className="flex-row gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Show results
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ErrorBoundary>
        {isError ? (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="mb-2">Couldn&apos;t load products.</p>
            <button type="button" onClick={() => void refetch()} className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div
              aria-busy={isPlaceholderData}
              className={cn(
                'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
                isPlaceholderData && 'opacity-60',
              )}
            >
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductSkeletonCard key={`s${i}`} />)
                : items.map((p) => <ProductCard key={p.id} product={p} />)}
              {isFetchingNextPage &&
                Array.from({ length: 4 }).map((_, i) => <ProductSkeletonCard key={`n${i}`} />)}
            </div>

            {isPlaceholderData && (
              <p className="sr-only" aria-live="polite">
                Updating results
              </p>
            )}
            {!isLoading && items.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">No products match your filters.</p>
            )}
            <div ref={setSentinel} className="h-px" aria-hidden="true" />
          </>
        )}
      </ErrorBoundary>
    </section>
  )
}
