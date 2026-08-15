'use client'

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearCart, selectCartItems } from '@/features/cart/cart-slice'
import { checkoutReducer, initialCheckoutState, STEPS, type Step, type CheckoutState } from './checkout-state'
import { CartReviewStep } from './cart-review-step'
import { ShippingStep } from './shipping-step'
import { BillingStep } from './billing-step'
import { ReviewStep } from './review-step'
import { placeOrder } from './checkout-api'
import { Skeleton } from '@/components/ui/skeleton'

const STEP_TITLES: Record<Step, string> = {
  cart: 'Cart',
  shipping: 'Shipping',
  billing: 'Billing',
  review: 'Review',
}

const STORAGE_KEY = 'checkout-state'

export function CheckoutWizard(): ReactNode {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState)
  const items = useAppSelector(selectCartItems)
  const appDispatch = useAppDispatch()
  const router = useRouter()
  const [isPlacing, setIsPlacing] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const persistReady = useRef(false)

  useEffect(() => {
    headingRef.current?.focus()
  }, [state.step])

  // Restore in-progress checkout once on mount (survives a trip to /account and back).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'restore', state: JSON.parse(raw) as CheckoutState })
    } catch {
      /* ignore malformed storage */
    }
  }, [])

  // Persist on change (skip the initial mount so we don't clobber saved state).
  useEffect(() => {
    if (!persistReady.current) {
      persistReady.current = true
      return
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota errors */
    }
  }, [state])

  // While the order is being placed (and the cart is cleared), show a placing
  // screen so the empty-cart view never flashes before the confirmation page.
  if (isPlacing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center gap-3">
          <span
            className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-sm font-medium" role="status">
            Placing your order…
          </p>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Continue shopping
        </Link>
      </div>
    )
  }

  async function onPlaceOrder(): Promise<void> {
    if (!state.shipping || !state.billing || !state.payment || isPlacing) return
    setIsPlacing(true)
    try {
      const orderId = await placeOrder({
        shipping: state.shipping,
        billing: state.billing,
        payment: state.payment,
      })
      appDispatch(clearCart())
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      router.push(`/orders/${orderId}`)
    } catch {
      toast.error('Could not place your order. Please try again.')
      setIsPlacing(false)
    }
  }

  const currentIndex = STEPS.indexOf(state.step)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ol className="mb-6 flex gap-2 text-sm" aria-label="Checkout progress">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={s === state.step ? 'step' : undefined}
            className={`flex-1 rounded-md border px-3 py-2 text-center ${
              s === state.step
                ? 'border-primary bg-primary/10 font-medium'
                : i < currentIndex
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/60'
            }`}
          >
            {i + 1}. {STEP_TITLES[s]}
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-lg font-semibold outline-none">
        {STEP_TITLES[state.step]}
      </h2>

      {state.step === 'cart' && <CartReviewStep onContinue={() => dispatch({ type: 'cartContinue' })} />}
      {state.step === 'shipping' && (
        <ShippingStep
          defaultValues={state.shipping}
          onSave={(shipping) => dispatch({ type: 'saveShipping', shipping })}
        />
      )}
      {state.step === 'billing' && state.shipping && (
        <BillingStep shipping={state.shipping} onSave={(r) => dispatch({ type: 'saveBilling', ...r })} />
      )}
      {state.step === 'review' && state.shipping && state.billing && state.payment && (
        <ReviewStep
          shipping={state.shipping}
          billing={state.billing}
          payment={state.payment}
          onPlaceOrder={onPlaceOrder}
          isPlacing={isPlacing}
        />
      )}

      {state.step !== 'cart' && (
        <button type="button" onClick={() => dispatch({ type: 'back' })} className="mt-4 text-sm underline">
          ← Back
        </button>
      )}
    </div>
  )
}
