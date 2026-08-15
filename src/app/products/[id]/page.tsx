import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/server/product-store'
import { listReviews, getRatingSummary } from '@/lib/server/review-store'
import { requireSession } from '@/lib/server/http'
import { ProductGallery } from '@/features/catalog/product-gallery'
import { ProductDetailPanel } from '@/features/catalog/product-detail-panel'
import { RecordRecentlyViewed } from '@/features/catalog/record-recently-viewed'
import { StarRating } from '@/features/reviews/star-rating'
import { ReviewSection } from '@/features/reviews/review-section'
import { ErrorBoundary } from '@/components/error-boundary'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  return { title: product?.title ?? 'Product' }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const [reviews, summary, session] = await Promise.all([
    listReviews(id),
    getRatingSummary(id),
    requireSession(),
  ])
  const viewer = !session ? 'guest' : session.role === 'seller' ? 'seller' : 'buyer'

  const gallery = [
    product.imageUrl,
    `https://picsum.photos/seed/${id}-b/800`,
    `https://picsum.photos/seed/${id}-c/800`,
    `https://picsum.photos/seed/${id}-d/800`,
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <RecordRecentlyViewed id={id} />
      <div className="grid gap-8 md:grid-cols-2">
        <ErrorBoundary>
          <ProductGallery images={gallery} alt={product.title} />
        </ErrorBoundary>
        <div>
          <h1 className="mb-1 text-2xl font-bold">{product.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
          {summary.count > 0 && (
            <div className="mt-1.5">
              <StarRating average={summary.average} count={summary.count} />
            </div>
          )}
          {product.sellerName && (
            <p className="mb-4 mt-1 text-sm">
              Sold by <span className="font-medium">{product.sellerName}</span>
              {product.sellerLocation ? ` · ${product.sellerLocation}` : ''}
            </p>
          )}
          <ErrorBoundary>
            <ProductDetailPanel product={product} />
          </ErrorBoundary>
        </div>
      </div>

      <ReviewSection
        productId={id}
        reviews={reviews}
        summary={summary}
        viewer={viewer}
        returnUrl={`/products/${id}`}
      />
    </div>
  )
}
