'use client'

import { useState, type ReactNode } from 'react'
import type { Product } from '@/types'
import { AddToCartButton } from './add-to-cart-button'

export interface ProductDetailPanelProps {
  product: Product
}

export function ProductDetailPanel({ product }: ProductDetailPanelProps): ReactNode {
  const [quantity, setQuantity] = useState(1)
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries((product.options ?? []).map((o) => [o.name, o.values[0]!])),
  )
  const outOfStock = product.stock === 0
  const variantLabel = Object.values(selected).join(' / ') || undefined

  return (
    <div className="space-y-4">
      {product.salePriceCents != null ? (
        <p className="text-2xl font-semibold">
          ${(product.salePriceCents / 100).toFixed(2)}
          <span className="ml-2 text-base font-normal text-muted-foreground line-through">
            ${(product.priceCents / 100).toFixed(2)}
          </span>
        </p>
      ) : (
        <p className="text-2xl font-semibold">${(product.priceCents / 100).toFixed(2)}</p>
      )}
      <p className={outOfStock ? 'text-destructive' : 'text-muted-foreground'}>
        {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
      </p>

      {product.options?.map((opt) => (
        <fieldset key={opt.name} className="space-y-1">
          <legend className="text-sm font-medium">{opt.name}</legend>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [opt.name]: v }))}
                aria-pressed={selected[opt.name] === v}
                className={`rounded-md border px-3 py-1 text-sm ${
                  selected[opt.name] === v ? 'border-primary bg-primary/10' : ''
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      {!outOfStock && (
        <div className="flex items-center gap-2">
          <label htmlFor="qty" className="text-sm font-medium">
            Qty
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={product.stock}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, product.stock)))
            }
            className="w-16 rounded-md border px-2 py-1 text-sm"
          />
        </div>
      )}

      <AddToCartButton product={product} quantity={quantity} variantLabel={variantLabel} />
    </div>
  )
}
