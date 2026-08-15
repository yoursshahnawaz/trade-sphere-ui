'use client'

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
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
        ...(imageUrl ? { imageUrl } : {}),
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
      <ol className="mb-6 flex items-center" aria-label="Product onboarding progress">
        {ONBOARDING_STEPS.map((s, i) => {
          const active = s === state.step
          const done = i < currentIndex
          const last = i === ONBOARDING_STEPS.length - 1
          return (
            <li
              key={s}
              aria-current={active ? 'step' : undefined}
              className={cn('flex items-center', !last && 'flex-1')}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1 transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground ring-primary'
                    : done
                      ? 'bg-primary/15 text-primary ring-primary/30'
                      : 'bg-muted text-muted-foreground ring-border',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'ml-2 hidden whitespace-nowrap text-sm font-medium sm:inline',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {TITLES[s]}
              </span>
              {!last && (
                <span
                  className={cn('mx-2 h-0.5 flex-1', done ? 'bg-primary/40' : 'bg-border')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
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
      {state.step === 'images' && (
        <ImagesStep
          imageUrl={imageUrl}
          onImageChange={setImageUrl}
          onSubmit={submit}
          isSubmitting={isSubmitting}
        />
      )}

      {state.step !== 'details' && (
        <button type="button" onClick={() => dispatch({ type: 'back' })} className="mt-4 text-sm underline">
          ← Back
        </button>
      )}
    </div>
  )
}
