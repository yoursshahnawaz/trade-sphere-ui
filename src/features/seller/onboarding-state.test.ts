import { describe, it, expect } from 'vitest'
import { onboardingReducer, initialOnboardingState, type OnboardingState } from './onboarding-state'

describe('onboardingReducer', () => {
  it('starts at the details step', () => {
    expect(initialOnboardingState.step).toBe('details')
  })

  it('advances details → pricing → images by saving each step', () => {
    let s = onboardingReducer(initialOnboardingState, {
      type: 'saveDetails',
      details: { title: 'Desk Mat', category: 'home' },
    })
    expect(s.step).toBe('pricing')
    expect(s.details?.title).toBe('Desk Mat')
    s = onboardingReducer(s, { type: 'savePricing', pricing: { priceCents: 1999, stock: 5 } })
    expect(s.step).toBe('images')
    expect(s.pricing?.priceCents).toBe(1999)
  })

  it('back moves toward details and never below it', () => {
    const atImages: OnboardingState = {
      step: 'images',
      details: { title: 'Desk Mat', category: 'home' },
      pricing: { priceCents: 1999, stock: 5 },
    }
    expect(onboardingReducer(atImages, { type: 'back' }).step).toBe('pricing')
    expect(onboardingReducer(initialOnboardingState, { type: 'back' }).step).toBe('details')
  })
})
