'use client'

import type { ReactNode } from 'react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps): ReactNode {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-1">
      <label htmlFor="product-search" className="text-xs font-medium">
        Search
      </label>
      <input
        id="product-search"
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products…"
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
      />
    </div>
  )
}
