import { Suspense, type ReactNode } from 'react'
import { PromoCarousel } from '@/features/promo/promo-carousel'
import { CatalogSection } from '@/features/catalog/catalog-section'

export default function HomePage(): ReactNode {
  return (
    <div>
      <PromoCarousel />
      <Suspense>
        <CatalogSection />
      </Suspense>
    </div>
  )
}
