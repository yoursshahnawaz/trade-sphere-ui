'use client'

import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import { Skeleton } from '@/components/ui/skeleton'
import { DropzoneUpload } from './dropzone-upload'
import { fetchSellerProduct, updateSellerProduct } from './seller-api'

const editSchema = z
  .object({
    title: z.string().min(2, 'Title is too short'),
    category: z.string().min(2, 'Pick a category'),
    description: z.string().optional(),
    priceDollars: z.number().positive('Price must be greater than 0'),
    saleDollars: z.number().positive('Sale price must be greater than 0').optional(),
    stock: z.number().int('Stock must be a whole number').nonnegative('Stock cannot be negative'),
    status: z.enum(['active', 'draft']),
    imageUrl: z.url('Enter a valid image URL').optional(),
  })
  .refine((d) => d.saleDollars == null || d.saleDollars < d.priceDollars, {
    message: 'Sale price must be less than the regular price',
    path: ['saleDollars'],
  })
type EditForm = z.infer<typeof editSchema>

const emptyToUndef = (v: unknown): unknown => (v === '' || v == null ? undefined : v)

export function EditProductForm({ id }: { id: string }): ReactNode {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['seller-product', id], queryFn: () => fetchSellerProduct(id) })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: product
      ? {
          title: product.title,
          category: product.category,
          description: product.description ?? '',
          priceDollars: product.priceCents / 100,
          saleDollars: product.salePriceCents != null ? product.salePriceCents / 100 : undefined,
          stock: product.stock,
          status: product.status,
          imageUrl: product.imageUrl,
        }
      : undefined,
  })

  const imageUrl = useWatch({ control, name: 'imageUrl' })

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      return ((await res.json()) as { categories: string[] }).categories
    },
  })
  const categories = cats ?? []

  async function onSubmit(form: EditForm): Promise<void> {
    try {
      await updateSellerProduct(id, {
        title: form.title,
        category: form.category,
        description: form.description,
        priceCents: Math.round(form.priceDollars * 100),
        salePriceCents: form.saleDollars != null ? Math.round(form.saleDollars * 100) : null,
        stock: form.stock,
        status: form.status,
        imageUrl: form.imageUrl,
      })
      await queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      await queryClient.invalidateQueries({ queryKey: ['seller-product', id] })
      toast.success('Product updated.')
      router.push('/seller/inventory')
    } catch {
      toast.error('Could not update the product. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    )
  }
  if (isError || !product) {
    return (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="mb-2">Couldn&apos;t load this product.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" aria-invalid={!!errors.title} {...register('title')} />
        <FieldError name="edit-title" message={errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="edit-category">Category</Label>
        <select
          id="edit-category"
          aria-invalid={!!errors.category}
          {...register('category')}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FieldError name="edit-category" message={errors.category?.message} />
      </div>

      <div>
        <Label htmlFor="edit-desc">Description (optional)</Label>
        <textarea
          id="edit-desc"
          rows={3}
          {...register('description')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-price">Price (₹)</Label>
          <Input
            id="edit-price"
            type="number"
            step="0.01"
            min="0"
            aria-invalid={!!errors.priceDollars}
            {...register('priceDollars', { valueAsNumber: true })}
          />
          <FieldError name="edit-price" message={errors.priceDollars?.message} />
        </div>
        <div>
          <Label htmlFor="edit-sale">Offer / sale price (₹, optional)</Label>
          <Input
            id="edit-sale"
            type="number"
            step="0.01"
            min="0"
            aria-invalid={!!errors.saleDollars}
            {...register('saleDollars', { setValueAs: (v) => (emptyToUndef(v) == null ? undefined : Number(v)) })}
          />
          <FieldError name="edit-sale" message={errors.saleDollars?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-stock">Stock</Label>
          <Input
            id="edit-stock"
            type="number"
            step="1"
            min="0"
            aria-invalid={!!errors.stock}
            {...register('stock', { valueAsNumber: true })}
          />
          <FieldError name="edit-stock" message={errors.stock?.message} />
        </div>
        <div>
          <Label htmlFor="edit-status">Status</Label>
          <select
            id="edit-status"
            {...register('status')}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="active">Active (visible to buyers)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Product image</Label>
        <div className="mt-1">
          <DropzoneUpload
            value={imageUrl}
            onChange={(url) => setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })}
          />
        </div>
        <Label htmlFor="edit-image" className="mt-3 block">
          Or paste an image URL
        </Label>
        <Input
          id="edit-image"
          type="url"
          aria-invalid={!!errors.imageUrl}
          {...register('imageUrl', { setValueAs: (v) => emptyToUndef(v) })}
        />
        <FieldError name="edit-image" message={errors.imageUrl?.message} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={() => router.push('/seller/inventory')} className="rounded-md border px-4 py-2 text-sm font-medium">
          Cancel
        </button>
      </div>
    </form>
  )
}
