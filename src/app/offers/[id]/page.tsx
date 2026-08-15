import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getOffer } from '@/lib/offers'
import { queryProducts } from '@/lib/server/product-store'
import { ProductCard } from '@/features/catalog/product-card'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const offer = getOffer(id)
  return { title: offer?.title ?? 'Offer', description: offer?.tagline }
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  const offer = getOffer(id)
  if (!offer) notFound()

  const { items } = queryProducts({ page: 1, limit: 48, category: offer.category })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/offers" className="text-sm underline">
        ← All offers
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-2xl bg-muted">
        <div className="relative h-48 w-full sm:h-64">
          <Image src={offer.img} alt="" fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 flex flex-col justify-center gap-2 bg-gradient-to-r from-black/75 to-black/20 p-6 text-white sm:p-8">
            <Badge tone="deal" className="w-fit">
              {offer.badge}
            </Badge>
            <h1 className="max-w-xl text-2xl font-bold text-white sm:text-4xl">{offer.title}</h1>
            <p className="max-w-xl text-sm text-white/90 sm:text-base">{offer.tagline}</p>
          </div>
        </div>
      </section>

      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{offer.description}</p>

      <h2 className="mt-8 mb-4 text-lg font-semibold">In this offer</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No products available right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
