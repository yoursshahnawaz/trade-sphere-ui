'use client'

import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/features/cart/cart-thunks'
import { effectivePriceCents } from '@/lib/product-price'
import type { Product } from '@/types'

export interface AddToCartButtonProps {
  product: Product
  quantity?: number
  variantLabel?: string
  className?: string
}

export function AddToCartButton({
  product,
  quantity = 1,
  variantLabel,
  className,
}: AddToCartButtonProps): ReactNode {
  const dispatch = useAppDispatch()
  const outOfStock = product.stock === 0

  async function onAdd(): Promise<void> {
    await dispatch(
      addToCart({
        productId: product.id,
        title: product.title,
        priceCents: effectivePriceCents(product),
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity,
      }),
    )
    toast.success(`Added ${product.title}${variantLabel ? ` (${variantLabel})` : ''} to cart`)
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className={
        className ??
        'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
      }
    >
      {outOfStock ? 'Out of stock' : 'Add to cart'}
    </button>
  )
}
