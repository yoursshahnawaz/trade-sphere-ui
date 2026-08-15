'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setCartDrawerOpen } from '@/store/ui-slice'
import { setQuantity, removeItem, selectCartItems, selectSubtotalCents } from './cart-slice'
import { formatINR } from '@/lib/money'
import { EmptyState } from '@/components/ui/empty-state'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'

export function CartDrawer(): ReactNode {
  const open = useAppSelector((s) => s.ui.cartDrawerOpen)
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectSubtotalCents)
  const dispatch = useAppDispatch()

  return (
    <Sheet open={open} onOpenChange={(next) => dispatch(setCartDrawerOpen(next))}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 px-4">
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Browse the marketplace and add something you love."
              action={
                <Link
                  href="/products"
                  onClick={() => dispatch(setCartDrawerOpen(false))}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
                >
                  Start shopping
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="flex-1 space-y-3 overflow-y-auto px-4">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatINR(item.priceCents)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.title}`}
                    onClick={() => dispatch(setQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                    className="rounded border p-1"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.title}`}
                    onClick={() => dispatch(setQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                    className="rounded border p-1"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => dispatch(removeItem(item.productId))}
                  className="rounded border p-1 text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <SheetFooter>
            <p className="flex justify-between text-sm font-medium" aria-live="polite">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </p>
            <Link
              href="/checkout"
              onClick={() => dispatch(setCartDrawerOpen(false))}
              className="w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Checkout
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
