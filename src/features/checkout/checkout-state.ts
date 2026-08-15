import type { Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'

export type Step = 'cart' | 'shipping' | 'billing' | 'review'
export const STEPS: Step[] = ['cart', 'shipping', 'billing', 'review']

export interface CheckoutState {
  step: Step
  shipping: Address | null
  billing: Address | null
  sameBilling: boolean
  payment: PaymentStored | null
}

export const initialCheckoutState: CheckoutState = {
  step: 'cart',
  shipping: null,
  billing: null,
  sameBilling: true,
  payment: null,
}

export type CheckoutAction =
  | { type: 'cartContinue' }
  | { type: 'saveShipping'; shipping: Address }
  | { type: 'saveBilling'; billing: Address; sameBilling: boolean; payment: PaymentStored }
  | { type: 'back' }
  | { type: 'restore'; state: CheckoutState }

function prevStep(step: Step): Step {
  const i = STEPS.indexOf(step)
  return STEPS[Math.max(0, i - 1)]!
}

// Forward progress only happens by committing a step's data — there is no
// arbitrary "goto", so a user cannot skip to Review without valid prior steps.
export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'cartContinue':
      return { ...state, step: 'shipping' }
    case 'saveShipping':
      return { ...state, shipping: action.shipping, step: 'billing' }
    case 'saveBilling':
      return {
        ...state,
        billing: action.billing,
        sameBilling: action.sameBilling,
        payment: action.payment,
        step: 'review',
      }
    case 'back':
      return { ...state, step: prevStep(state.step) }
    case 'restore':
      return action.state
    default:
      return state
  }
}
