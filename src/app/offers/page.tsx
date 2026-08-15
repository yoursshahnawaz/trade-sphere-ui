import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { OFFERS } from '@/lib/offers'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Offers', description: 'Curated deals across Trade-Sphere sellers.' }

export default function OffersPage(): ReactNode {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Offers</h1>
      <p className="mb-6 text-sm text-muted-foreground">Curated deals across our sellers.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <Link
            key={o.id}
            href={`/offers/${o.id}`}
            className="group/offer flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[16/9] bg-muted">
              <Image src={o.img} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              <Badge tone="deal" className="absolute left-3 top-3 shadow-sm">
                {o.badge}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="text-lg font-semibold">{o.title}</h2>
              <p className="text-sm text-muted-foreground">{o.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
