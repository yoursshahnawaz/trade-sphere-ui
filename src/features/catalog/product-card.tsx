'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/features/cart/cart-thunks'
import { effectivePriceCents } from '@/lib/product-price'
import type { Product, CartLine } from '@/types'

function lineFromProduct(p: Product): CartLine {
  return {
    productId: p.id,
    title: p.title,
    priceCents: effectivePriceCents(p),
    imageUrl: p.imageUrl,
    stock: p.stock,
    quantity: 1,
  }
}

export interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps): ReactNode {
  const dispatch = useAppDispatch()
  const outOfStock = product.stock === 0

  async function onAdd(): Promise<void> {
    await dispatch(addToCart(lineFromProduct(product)))
    toast.success(`Added ${product.title} to cart`)
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      {/* Link wraps only image + title; the add-to-cart button is a sibling
          (no interactive element nested inside the <a>). */}
      <Link href={`/products/${product.id}`} className="group flex flex-col gap-2 rounded-md">
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.title}</h3>
      </Link>
      {product.salePriceCents != null ? (
        <p className="text-sm">
          <span className="font-medium text-foreground">${(product.salePriceCents / 100).toFixed(2)}</span>{' '}
          <span className="text-muted-foreground line-through">${(product.priceCents / 100).toFixed(2)}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">${(product.priceCents / 100).toFixed(2)}</p>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={outOfStock}
        className="mt-auto rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {outOfStock ? 'Out of stock' : 'Add to cart'}
      </button>
    </article>
  )
}
