'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'
import { AddressFields } from '@/features/checkout/address-fields'
import { fetchAddresses, addAddressReq, deleteAddressReq } from './account-api'

export function AddressManager(): ReactNode {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses })
  const [adding, setAdding] = useState(false)
  const addresses = data ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Address>({ resolver: zodResolver(addressSchema), defaultValues: { country: 'India' } })

  async function onAdd(a: Address): Promise<void> {
    try {
      await addAddressReq(a)
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address saved.')
      reset({ country: 'India' })
      setAdding(false)
    } catch {
      toast.error('Could not save the address.')
    }
  }

  async function onDelete(index: number): Promise<void> {
    try {
      await deleteAddressReq(index)
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address removed.')
    } catch {
      toast.error('Could not remove the address.')
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 text-sm">
              <div>
                <p className="font-medium">{a.fullName}</p>
                <p className="text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.region} {a.postalCode}, {a.country}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete address for ${a.fullName}`}
                onClick={() => onDelete(i)}
                className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4 rounded-lg border bg-card p-4" noValidate>
          <AddressFields register={register} errors={errors} idPrefix="acc-addr" />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Save address
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                reset({ country: 'India' })
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Plus className="size-4" /> Add a new address
        </button>
      )}
    </div>
  )
}
