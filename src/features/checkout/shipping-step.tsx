'use client'

import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'
import { AddressFields } from './address-fields'

export interface ShippingStepProps {
  defaultValues: Address | null
  onSave: (address: Address) => void
}

export function ShippingStep({ defaultValues, onSave }: ShippingStepProps): ReactNode {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues ?? undefined,
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <AddressFields register={register} errors={errors} idPrefix="ship" />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Continue to billing
      </button>
    </form>
  )
}
