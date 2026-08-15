import { Suspense, type ReactNode } from 'react'
import type { Metadata } from 'next'
import { CatalogSection } from '@/features/catalog/catalog-section'

export const metadata: Metadata = {
  title: 'All products',
  description: 'Browse every product listed by sellers on Trade-Sphere.',
}

export default function ProductsPage(): ReactNode {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="text-2xl font-bold">All products</h1>
        <p className="text-sm text-muted-foreground">Everything our sellers have listed, in one place.</p>
      </div>
      <Suspense>
        <CatalogSection />
      </Suspense>
    </>
  )
}
