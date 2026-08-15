'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface CatalogFilterBarProps {
  category: string | null
  onCategory: (value: string | null) => void
  minPrice: number | null
  onMinPrice: (value: number | null) => void
  maxPrice: number | null
  onMaxPrice: (value: number | null) => void
  inStock: boolean
  onInStock: (value: boolean) => void
}

function toRupees(cents: number | null): string {
  return cents == null ? '' : String(cents / 100)
}
function fromRupees(v: string): number | null {
  return v === '' ? null : Math.round(Number(v) * 100)
}

const CONTROL =
  'h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function CatalogFilterBar(props: CatalogFilterBarProps): ReactNode {
  const { category, onCategory, minPrice, onMinPrice, maxPrice, onMaxPrice, inStock, onInStock } = props
  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch('/api/categories')
      const body = (await res.json()) as { categories: string[] }
      return body.categories
    },
  })
  const categories = data ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="filter-category"
          value={category ?? ''}
          onChange={(e) => onCategory(e.target.value || null)}
          className={CONTROL}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Price (₹)</span>
        <div className="flex items-center gap-2">
          <input
            aria-label="Minimum price in rupees"
            type="number"
            min={0}
            placeholder="Min"
            value={toRupees(minPrice)}
            onChange={(e) => onMinPrice(fromRupees(e.target.value))}
            className={CONTROL}
          />
          <span className="text-muted-foreground">–</span>
          <input
            aria-label="Maximum price in rupees"
            type="number"
            min={0}
            placeholder="Max"
            value={toRupees(maxPrice)}
            onChange={(e) => onMaxPrice(fromRupees(e.target.value))}
            className={CONTROL}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => onInStock(e.target.checked)}
          className="size-4 accent-primary"
        />
        In stock only
      </label>
    </div>
  )
}
