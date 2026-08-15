'use client'

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  onboardingReducer,
  initialOnboardingState,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from './onboarding-state'
import { DetailsStep } from './details-step'
import { PricingStep } from './pricing-step'
import { ImagesStep } from './images-step'
import { createSellerProduct } from './seller-api'

const TITLES: Record<OnboardingStep, string> = {
  details: 'Details',
  pricing: 'Pricing & inventory',
  images: 'Images',
}

export function OnboardingWizard(): ReactNode {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [state.step])

  async function submit(status: 'active' | 'draft'): Promise<void> {
    if (!state.details || !state.pricing || isSubmitting) return
    setIsSubmitting(true)
    try {
      await createSellerProduct({
        title: state.details.title,
        category: state.details.category,
        description: state.details.description,
        priceCents: state.pricing.priceCents,
        stock: state.pricing.stock,
        status,
      })
      await queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success(status === 'draft' ? 'Draft saved.' : 'Product published.')
      router.push('/seller/inventory')
    } catch {
      toast.error('Could not save the product. Please try again.')
      setIsSubmitting(false)
    }
  }

  const currentIndex = ONBOARDING_STEPS.indexOf(state.step)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ol className="mb-6 flex gap-2 text-sm" aria-label="Product onboarding progress">
        {ONBOARDING_STEPS.map((s, i) => (
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
            {i + 1}. {TITLES[s]}
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-lg font-semibold outline-none">
        {TITLES[state.step]}
      </h2>

      {state.step === 'details' && (
        <DetailsStep defaultValues={state.details} onSave={(details) => dispatch({ type: 'saveDetails', details })} />
      )}
      {state.step === 'pricing' && (
        <PricingStep defaultValues={state.pricing} onSave={(pricing) => dispatch({ type: 'savePricing', pricing })} />
      )}
      {state.step === 'images' && <ImagesStep onSubmit={submit} isSubmitting={isSubmitting} />}

      {state.step !== 'details' && (
        <button type="button" onClick={() => dispatch({ type: 'back' })} className="mt-4 text-sm underline">
          ← Back
        </button>
      )}
    </div>
  )
}
