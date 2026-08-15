import type { ReactNode } from 'react'
import Link from 'next/link'
import { InventoryTable } from '@/features/seller/inventory-table'

export default function SellerInventoryPage(): ReactNode {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Link
          href="/seller/products/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add product
        </Link>
      </div>
      <InventoryTable />
    </div>
  )
}
