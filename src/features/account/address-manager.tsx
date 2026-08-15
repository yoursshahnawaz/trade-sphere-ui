'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'
import { AddressFields } from '@/features/checkout/address-fields'
import { fetchAddresses, addAddressReq, updateAddressReq, deleteAddressReq, setDefaultReq } from './account-api'

export function AddressManager(): ReactNode {
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: fetchAddresses })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const addresses = data ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Address>({ resolver: zodResolver(addressSchema), defaultValues: { country: 'India' } })

  function openAdd(): void {
    setEditingIndex(null)
    reset({ country: 'India' })
    setFormOpen(true)
  }
  function openEdit(index: number): void {
    setEditingIndex(index)
    reset(addresses[index])
    setFormOpen(true)
  }
  function closeForm(): void {
    setFormOpen(false)
    setEditingIndex(null)
    reset({ country: 'India' })
  }

  async function onSubmit(a: Address): Promise<void> {
    try {
      if (editingIndex != null) await updateAddressReq(editingIndex, a)
      else await addAddressReq(a)
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success(editingIndex != null ? 'Address updated.' : 'Address saved.')
      closeForm()
    } catch {
      toast.error('Could not save the address.')
    }
  }

  async function onSetDefault(index: number): Promise<void> {
    try {
      await setDefaultReq(index)
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Default address updated.')
    } catch {
      toast.error('Could not set the default address.')
    }
  }

  async function onDelete(index: number, name: string): Promise<void> {
    const ok = await confirm({
      title: 'Delete this address?',
      description: `“${name}” will be removed from your saved addresses.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.fullName}</p>
                  {i === 0 && <Badge tone="brand">Default</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.region} {a.postalCode}
                </p>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(i)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Star className="size-3.5" /> Make default
                  </button>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Edit address for ${a.fullName}`}
                  onClick={() => openEdit(i)}
                  className="grid size-8 place-items-center rounded-md border text-foreground transition-colors hover:bg-muted"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete address for ${a.fullName}`}
                  onClick={() => onDelete(i, a.fullName)}
                  className="grid size-8 place-items-center rounded-md border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border bg-card p-4" noValidate>
          <p className="font-medium">{editingIndex != null ? 'Edit address' : 'New address'}</p>
          <AddressFields register={register} errors={errors} idPrefix="acc-addr" />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
            >
              {editingIndex != null ? 'Save changes' : 'Save address'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Plus className="size-4" /> Add a new address
        </button>
      )}
    </div>
  )
}
