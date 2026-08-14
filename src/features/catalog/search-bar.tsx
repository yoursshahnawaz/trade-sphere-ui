'use client'

import type { ReactNode } from 'react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps): ReactNode {
  return (
    <div className="w-full">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products…"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
    </div>
  )
}
