import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/server/product-store'
import { ProductGallery } from '@/features/catalog/product-gallery'
import { ProductDetailPanel } from '@/features/catalog/product-detail-panel'
import { ErrorBoundary } from '@/components/error-boundary'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = getProduct(id)
  return { title: product?.title ?? 'Product' }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  const product = getProduct(id)
  if (!product) notFound()

  const gallery = [
    product.imageUrl,
    `https://picsum.photos/seed/${id}-b/800`,
    `https://picsum.photos/seed/${id}-c/800`,
    `https://picsum.photos/seed/${id}-d/800`,
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ErrorBoundary>
          <ProductGallery images={gallery} alt={product.title} />
        </ErrorBoundary>
        <div>
          <h1 className="mb-1 text-2xl font-bold">{product.title}</h1>
          <p className="mb-4 text-sm text-muted-foreground capitalize">{product.category}</p>
          <ErrorBoundary>
            <ProductDetailPanel product={product} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
