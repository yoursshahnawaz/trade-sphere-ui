import type { ReactNode } from 'react'
import { seedProducts } from '@/mocks/seed/products'
import { ProductCard } from '@/features/catalog/product-card'

// Temporary — Phase 3 replaces this with the infinite catalog + /api/products.
export default function HomePage(): ReactNode {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Featured products</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {seedProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  )
}
