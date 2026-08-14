'use client'

import type { ReactNode } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'
import { AddressFields } from './address-fields'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'

const billingFormSchema = z
  .object({
    sameBilling: z.boolean(),
    fullName: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    method: z.enum(['card', 'cod']),
    cardName: z.string().optional(),
    cardNumber: z.string().optional(),
    expiry: z.string().optional(),
    cvc: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.sameBilling) {
      const r = addressSchema.safeParse({
        fullName: d.fullName,
        line1: d.line1,
        line2: d.line2,
        city: d.city,
        region: d.region,
        postalCode: d.postalCode,
        country: d.country,
      })
      if (!r.success) {
        for (const issue of r.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
      }
    }
    if (d.method === 'card') {
      if ((d.cardName ?? '').length < 2) ctx.addIssue({ code: 'custom', path: ['cardName'], message: 'Required' })
      if (!/^\d{13,19}$/.test(d.cardNumber ?? '')) ctx.addIssue({ code: 'custom', path: ['cardNumber'], message: 'Enter a valid card number' })
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.expiry ?? '')) ctx.addIssue({ code: 'custom', path: ['expiry'], message: 'MM/YY' })
      if (!/^\d{3,4}$/.test(d.cvc ?? '')) ctx.addIssue({ code: 'custom', path: ['cvc'], message: '3–4 digits' })
    }
  })
type BillingFormValues = z.infer<typeof billingFormSchema>

export interface BillingStepProps {
  shipping: Address
  onSave: (result: { billing: Address; sameBilling: boolean; payment: PaymentStored }) => void
}

export function BillingStep({ shipping, onSave }: BillingStepProps): ReactNode {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: { sameBilling: true, method: 'card' },
  })
  const sameBilling = watch('sameBilling')
  const method = watch('method')

  const cardErr = (name: 'cardName' | 'cardNumber' | 'expiry' | 'cvc'): string | undefined => {
    const m = errors[name]?.message
    return typeof m === 'string' ? m : undefined
  }

  function onSubmit(d: BillingFormValues): void {
    const billing: Address = d.sameBilling
      ? shipping
      : {
          fullName: d.fullName!,
          line1: d.line1!,
          line2: d.line2,
          city: d.city!,
          region: d.region!,
          postalCode: d.postalCode!,
          country: d.country!,
        }
    const payment: PaymentStored =
      d.method === 'card'
        ? { method: 'card', cardLast4: (d.cardNumber ?? '').slice(-4) }
        : { method: 'cod' }
    onSave({ billing, sameBilling: d.sameBilling, payment })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('sameBilling')} /> Billing same as shipping
      </label>
      {!sameBilling && <AddressFields register={register} errors={errors} idPrefix="bill" />}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Payment method</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="card" {...register('method')} /> Card
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="cod" {...register('method')} /> Cash on delivery
        </label>
      </fieldset>

      {method === 'card' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cardName">Name on card</Label>
            <Input id="cardName" autoComplete="cc-name" aria-invalid={!!cardErr('cardName')} {...register('cardName')} />
            <FieldError name="cardName" message={cardErr('cardName')} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input id="cardNumber" inputMode="numeric" autoComplete="cc-number" aria-invalid={!!cardErr('cardNumber')} {...register('cardNumber')} />
            <FieldError name="cardNumber" message={cardErr('cardNumber')} />
          </div>
          <div>
            <Label htmlFor="expiry">Expiry (MM/YY)</Label>
            <Input id="expiry" placeholder="MM/YY" autoComplete="cc-exp" aria-invalid={!!cardErr('expiry')} {...register('expiry')} />
            <FieldError name="expiry" message={cardErr('expiry')} />
          </div>
          <div>
            <Label htmlFor="cvc">CVC</Label>
            <Input id="cvc" inputMode="numeric" autoComplete="cc-csc" aria-invalid={!!cardErr('cvc')} {...register('cvc')} />
            <FieldError name="cvc" message={cardErr('cvc')} />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Review order
      </button>
    </form>
  )
}
