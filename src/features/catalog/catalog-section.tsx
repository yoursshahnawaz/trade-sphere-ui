'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/error-boundary'
import { useDebouncedValue } from './use-debounced-value'
import { useProducts, type CatalogFilters } from './use-products'
import { useInfiniteScroll } from './use-infinite-scroll'
import { ProductCard } from './product-card'
import { ProductSkeletonCard } from './product-skeleton-card'
import { SearchBar } from './search-bar'
import { CatalogFilterBar } from './catalog-filters'

export function CatalogSection(): ReactNode {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [inStock, setInStock] = useState(false)

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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SearchBar value={q} onChange={setQ} />
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
