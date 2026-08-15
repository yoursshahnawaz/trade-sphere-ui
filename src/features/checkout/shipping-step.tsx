'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
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
    reset,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues ?? undefined,
  })
  const [saveAddress, setSaveAddress] = useState(false)

  const { data } = useQuery({
    queryKey: ['addresses'],
    queryFn: async (): Promise<Address[]> => {
      const res = await fetch('/api/addresses')
      if (!res.ok) return []
      const body = (await res.json()) as { addresses: Address[] }
      return body.addresses
    },
  })
  const addresses = data ?? []

  async function onSubmit(address: Address): Promise<void> {
    if (saveAddress) {
      try {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(address),
        })
      } catch {
        /* saving is best-effort — still proceed to billing */
      }
    }
    onSave(address)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {addresses.length > 0 && (
        <div>
          <label htmlFor="saved-address" className="text-xs font-medium">
            Use a saved address
          </label>
          <select
            id="saved-address"
            defaultValue=""
            onChange={(e) => {
              const a = addresses[Number(e.target.value)]
              if (a) reset(a)
            }}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">New address…</option>
            {addresses.map((a, i) => (
              <option key={i} value={i}>
                {a.fullName} — {a.line1}, {a.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <AddressFields register={register} errors={errors} idPrefix="ship" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
        Save this address for next time
      </label>

      <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Continue to billing
      </button>
    </form>
  )
}
