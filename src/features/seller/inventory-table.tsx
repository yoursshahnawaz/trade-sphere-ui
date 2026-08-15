'use client'

import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { ErrorBoundary } from '@/components/error-boundary'
import { productStatus, type ProductStatus } from '@/lib/seller-status'
import { fetchSellerProducts } from './seller-api'
import { StatusBadge } from './status-badge'
import type { SellerProduct } from '@/lib/schemas/seller-product-schema'

const price = (cents: number): string => `$${(cents / 100).toFixed(2)}`

// Module scope → referentially stable across renders (avoids react-table re-render churn).
const EMPTY: SellerProduct[] = []
const columns: ColumnDef<SellerProduct>[] = [
  { accessorKey: 'title', header: 'Product' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'priceCents', header: 'Price', cell: (c) => price(c.getValue<number>()) },
  { accessorKey: 'stock', header: 'Stock' },
  {
    id: 'status',
    accessorFn: (p) => productStatus(p), // accessor value → participates in global search
    header: 'Status',
    cell: (c) => <StatusBadge status={c.getValue<ProductStatus>()} />,
  },
]

function ariaSort(dir: false | 'asc' | 'desc'): 'ascending' | 'descending' | 'none' {
  return dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
}

export function InventoryTable(): ReactNode {
  return (
    <ErrorBoundary>
      <InventoryTableInner />
    </ErrorBoundary>
  )
}

function InventoryTableInner(): ReactNode {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['seller-products'],
    queryFn: ({ signal }) => fetchSellerProducts(signal),
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own memoization; opting this component out of React Compiler is expected and safe.
  const table = useReactTable({
    data: data ?? EMPTY,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isError) {
    return (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="mb-2">Couldn&apos;t load your inventory.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div>
      <label className="mb-4 block max-w-xs">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
        />
      </label>

      <div aria-busy={isLoading} className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th key={header.id} scope="col" aria-sort={ariaSort(sorted)} className="px-4 py-3 font-medium">
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden="true">{sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, r) => (
                  <tr key={`sk${r}`} className="border-t border-foreground/5">
                    {columns.map((_, c) => (
                      <td key={c} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.id} className="border-t border-foreground/5">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 && (
          <p className="px-4 py-8 text-center text-muted-foreground">No products match your search.</p>
        )}
      </div>
    </div>
  )
}
