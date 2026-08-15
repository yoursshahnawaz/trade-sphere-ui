'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { fetchSellerProducts, updateSellerProduct, deleteSellerProduct } from './seller-api'
import { StatusBadge } from './status-badge'
import type { SellerProduct } from '@/lib/schemas/seller-product-schema'
import { formatINR } from '@/lib/money'

const dollars = (cents: number): string => formatINR(cents)

function PriceCell({ product }: { product: SellerProduct }): ReactNode {
  if (product.salePriceCents == null) return <span>{dollars(product.priceCents)}</span>
  return (
    <span>
      <span className="font-medium">{dollars(product.salePriceCents)}</span>{' '}
      <span className="text-muted-foreground line-through">{dollars(product.priceCents)}</span>
    </span>
  )
}

function RowActions({ product }: { product: SellerProduct }): ReactNode {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [addQty, setAddQty] = useState('')

  async function onRestock(e: FormEvent): Promise<void> {
    e.preventDefault()
    const n = Number(addQty)
    if (!Number.isInteger(n) || n <= 0) return
    setBusy(true)
    try {
      await updateSellerProduct(product.id, { stock: product.stock + n })
      await queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success(`Added ${n} to ${product.title}.`)
      setAddQty('')
    } catch {
      toast.error('Could not update stock.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(): Promise<void> {
    if (!window.confirm(`Delete "${product.title}"? This removes it from your storefront.`)) return
    setBusy(true)
    try {
      await deleteSellerProduct(product.id)
      await queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success('Product deleted.')
    } catch {
      toast.error('Could not delete the product.')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={onRestock} className="flex items-center gap-1">
        <label htmlFor={`add-${product.id}`} className="sr-only">
          Add stock for {product.title}
        </label>
        <input
          id={`add-${product.id}`}
          type="number"
          min="1"
          value={addQty}
          onChange={(e) => setAddQty(e.target.value)}
          placeholder="+ qty"
          className="w-16 rounded-md border border-foreground/15 px-2 py-1 text-sm"
        />
        <button type="submit" disabled={busy || !addQty} className="rounded-md border px-2 py-1 text-xs disabled:opacity-50">
          Add
        </button>
      </form>
      <Link href={`/seller/products/${product.id}/edit`} className="rounded-md border px-2 py-1 text-xs">
        Edit
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}

// Module scope → referentially stable across renders (avoids react-table re-render churn).
const EMPTY: SellerProduct[] = []
const columns: ColumnDef<SellerProduct>[] = [
  { accessorKey: 'title', header: 'Product' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'priceCents', header: 'Price', cell: (c) => <PriceCell product={c.row.original} /> },
  { accessorKey: 'stock', header: 'Stock' },
  {
    id: 'status',
    accessorFn: (p) => productStatus(p), // accessor value → participates in global search
    header: 'Status',
    cell: (c) => <StatusBadge status={c.getValue<ProductStatus>()} />,
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: (c) => <RowActions product={c.row.original} />,
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
