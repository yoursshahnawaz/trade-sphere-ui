'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'
import { fetchAddresses } from '@/features/account/account-api'
import { AddressFields } from './address-fields'

export interface ShippingStepProps {
  defaultValues: Address | null
  onSave: (address: Address) => void
}

type Selection = 'auto' | 'new' | number

export function ShippingStep({ defaultValues, onSave }: ShippingStepProps): ReactNode {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues ?? { country: 'India' },
  })
  const [saveAddress, setSaveAddress] = useState(false)
  const [selection, setSelection] = useState<Selection>('auto')

  const { data } = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses })
  const addresses = data ?? []

  // Default (index 0) is preselected unless the user came back with an entered address.
  const effective: 'new' | number =
    selection === 'auto' ? (!defaultValues && addresses.length > 0 ? 0 : 'new') : selection
  const usingSaved = typeof effective === 'number'
  const selected = usingSaved ? addresses[effective] : undefined

  async function saveNew(address: Address): Promise<void> {
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
    <div className="space-y-5">
      {addresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Deliver to</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {addresses.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelection(i)}
                aria-pressed={effective === i}
                className={cn(
                  'rounded-xl border p-3 text-left text-sm transition-colors',
                  effective === i ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.fullName}</span>
                  {i === 0 && <Badge tone="brand">Default</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {a.line1}, {a.city}, {a.region} {a.postalCode}
                </p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelection('new')}
              aria-pressed={effective === 'new'}
              className={cn(
                'rounded-xl border border-dashed p-3 text-left text-sm font-medium transition-colors',
                effective === 'new' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
              )}
            >
              + Use a new address
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Saved addresses are read-only here.{' '}
            <Link href="/account" className="font-medium text-foreground underline">
              Manage saved addresses
            </Link>
          </p>
        </div>
      )}

      {usingSaved && selected ? (
        <div className="space-y-4">
          <dl className="grid gap-x-4 gap-y-2 rounded-xl border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="font-medium">{selected.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Address</dt>
              <dd>
                {selected.line1}
                {selected.line2 ? `, ${selected.line2}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">City / State</dt>
              <dd>
                {selected.city}, {selected.region}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">PIN / Country</dt>
              <dd>
                {selected.postalCode}, {selected.country}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            Continue to billing
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(saveNew)} className="space-y-4" noValidate>
          <AddressFields register={register} errors={errors} idPrefix="ship" />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="size-4 accent-primary"
            />
            Save this address for next time
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            Continue to billing
          </button>
        </form>
      )}
    </div>
  )
}
