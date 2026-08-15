'use client'

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearCart, selectCartItems } from '@/features/cart/cart-slice'
import { checkoutReducer, initialCheckoutState, STEPS, type Step } from './checkout-state'
import { CartReviewStep } from './cart-review-step'
import { ShippingStep } from './shipping-step'
import { BillingStep } from './billing-step'
import { ReviewStep } from './review-step'
import { placeOrder } from './checkout-api'

const STEP_TITLES: Record<Step, string> = {
  cart: 'Cart',
  shipping: 'Shipping',
  billing: 'Billing',
  review: 'Review',
}

export function CheckoutWizard(): ReactNode {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState)
  const items = useAppSelector(selectCartItems)
  const appDispatch = useAppDispatch()
  const router = useRouter()
  const [isPlacing, setIsPlacing] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [state.step])

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Link href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
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
