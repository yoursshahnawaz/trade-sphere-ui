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

function toDollars(cents: number | null): string {
  return cents == null ? '' : String(cents / 100)
}
function fromDollars(v: string): number | null {
  return v === '' ? null : Math.round(Number(v) * 100)
}

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
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium">Category</label>
        <select
          id="filter-category"
          value={category ?? ''}
          onChange={(e) => onCategory(e.target.value || null)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-min" className="text-xs font-medium">Min $</label>
        <input
          id="filter-min"
          type="number"
          min={0}
          value={toDollars(minPrice)}
          onChange={(e) => onMinPrice(fromDollars(e.target.value))}
          className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-max" className="text-xs font-medium">Max $</label>
        <input
          id="filter-max"
          type="number"
          min={0}
          value={toDollars(maxPrice)}
          onChange={(e) => onMaxPrice(fromDollars(e.target.value))}
          className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inStock} onChange={(e) => onInStock(e.target.checked)} />
        In stock only
      </label>
    </div>
  )
}
