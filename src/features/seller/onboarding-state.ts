export type OnboardingStep = 'details' | 'pricing' | 'images'
export const ONBOARDING_STEPS: OnboardingStep[] = ['details', 'pricing', 'images']

export interface OnboardingDetails {
  title: string
  category: string
  description?: string
}
export interface OnboardingPricing {
  priceCents: number
  stock: number
}

export interface OnboardingState {
  step: OnboardingStep
  details: OnboardingDetails | null
  pricing: OnboardingPricing | null
}

export const initialOnboardingState: OnboardingState = { step: 'details', details: null, pricing: null }

export type OnboardingAction =
  | { type: 'saveDetails'; details: OnboardingDetails }
  | { type: 'savePricing'; pricing: OnboardingPricing }
  | { type: 'back' }

function prevStep(step: OnboardingStep): OnboardingStep {
  const i = ONBOARDING_STEPS.indexOf(step)
  return ONBOARDING_STEPS[Math.max(0, i - 1)]!
}

// Forward progress only happens by committing a step's data — no arbitrary "goto",
// so a user cannot reach the images/submit step without valid details + pricing.
export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'saveDetails':
      return { ...state, details: action.details, step: 'pricing' }
    case 'savePricing':
      return { ...state, pricing: action.pricing, step: 'images' }
    case 'back':
      return { ...state, step: prevStep(state.step) }
    default:
      return state
  }
}
