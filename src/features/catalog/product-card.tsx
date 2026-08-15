import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AddToCartControl } from '@/features/cart/add-to-cart-control'
import { StarRating } from '@/features/reviews/star-rating'
import { formatINR } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/types'

export interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps): ReactNode {
  const onSale = product.salePriceCents != null
  return (
    <article className="group/card flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="flex flex-col gap-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.imageUrl}
            alt="" // decorative: the adjacent <h3> title names this link (avoids redundant alt)
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
          {onSale && (
            <Badge tone="deal" className="absolute left-2 top-2 shadow-sm">
              Sale
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.title}</h3>
      </Link>
      {product.sellerName && (
        <p className="-mt-1 truncate text-xs text-muted-foreground">by {product.sellerName}</p>
      )}
      {product.ratingCount != null && product.ratingCount > 0 && (
        <StarRating average={product.ratingAverage ?? 0} count={product.ratingCount} />
      )}
      {onSale ? (
        <p className="text-sm">
          <span className="font-semibold text-foreground">{formatINR(product.salePriceCents!)}</span>{' '}
          <span className="text-muted-foreground line-through">{formatINR(product.priceCents)}</span>
        </p>
      ) : (
        <p className="text-sm font-semibold text-foreground">{formatINR(product.priceCents)}</p>
      )}
      <AddToCartControl product={product} className="mt-auto w-full" />
    </article>
  )
}
