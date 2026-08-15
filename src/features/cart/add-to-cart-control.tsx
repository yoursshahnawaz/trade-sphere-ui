'use client'

import type { ReactNode } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCart } from './cart-thunks'
import { setQuantity, selectCartItems } from './cart-slice'
import { effectivePriceCents } from '@/lib/product-price'
import type { Product } from '@/types'

export interface AddToCartControlProps {
  product: Product
  quantity?: number
  variantLabel?: string
  className?: string
}

/** Shows an "Add to cart" button until the item is in the cart, then a quantity stepper. */
export function AddToCartControl({
  product,
  quantity = 1,
  variantLabel,
  className,
}: AddToCartControlProps): ReactNode {
  const dispatch = useAppDispatch()
  const inCart = useAppSelector((s) => selectCartItems(s).find((i) => i.productId === product.id))
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

  if (!inCart) {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={outOfStock}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <ShoppingCart className="size-4" />
        {outOfStock ? 'Out of stock' : 'Add to cart'}
      </button>
    )
  }

  const atMax = inCart.quantity >= product.stock
  return (
    <div
      role="group"
      aria-label={`Quantity of ${product.title} in cart`}
      className={cn('inline-flex items-center rounded-lg border border-input bg-card shadow-sm', className)}
    >
      <button
        type="button"
        aria-label={`Decrease ${product.title}`}
        onClick={() => dispatch(setQuantity({ productId: product.id, quantity: inCart.quantity - 1 }))}
        className="grid size-9 place-items-center rounded-l-lg text-foreground transition-colors hover:bg-muted"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-9 px-1 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {inCart.quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase ${product.title}`}
        disabled={atMax}
        onClick={() => dispatch(setQuantity({ productId: product.id, quantity: inCart.quantity + 1 }))}
        className="grid size-9 place-items-center rounded-r-lg text-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
