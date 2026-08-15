'use client'

import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import type { OnboardingPricing } from './onboarding-state'

// Business rules: positive price, non-negative whole-number stock. Fields register
// with valueAsNumber (empty → NaN → rejected), so an invalid value blocks advancing.
const pricingSchema = z.object({
  priceDollars: z.number().positive('Price must be greater than 0'),
  stock: z.number().int('Stock must be a whole number').nonnegative('Stock cannot be negative'),
})
type PricingForm = z.infer<typeof pricingSchema>

export interface PricingStepProps {
  defaultValues: OnboardingPricing | null
  onSave: (pricing: OnboardingPricing) => void
}

export function PricingStep({ defaultValues, onSave }: PricingStepProps): ReactNode {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PricingForm>({
    resolver: zodResolver(pricingSchema),
    defaultValues: defaultValues
      ? { priceDollars: defaultValues.priceCents / 100, stock: defaultValues.stock }
      : undefined,
  })

  function submit(form: PricingForm): void {
    onSave({ priceCents: Math.round(form.priceDollars * 100), stock: form.stock })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="prod-price">Price (₹)</Label>
        <Input
          id="prod-price"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          aria-invalid={!!errors.priceDollars}
          {...register('priceDollars', { valueAsNumber: true })}
        />
        <FieldError name="prod-price" message={errors.priceDollars?.message} />
      </div>

      <div>
        <Label htmlFor="prod-stock">Stock</Label>
        <Input
          id="prod-stock"
          type="number"
          step="1"
          min="0"
          inputMode="numeric"
          aria-invalid={!!errors.stock}
          {...register('stock', { valueAsNumber: true })}
        />
        <FieldError name="prod-stock" message={errors.stock?.message} />
      </div>

      <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Continue to images
      </button>
    </form>
  )
}
