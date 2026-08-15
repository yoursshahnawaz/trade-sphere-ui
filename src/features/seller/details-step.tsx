'use client'

import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import type { z } from 'zod'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import { sellerProductInputSchema } from '@/lib/schemas/seller-product-schema'
import type { OnboardingDetails } from './onboarding-state'

const detailsSchema = sellerProductInputSchema.pick({ title: true, category: true, description: true })
type DetailsForm = z.infer<typeof detailsSchema>

export interface DetailsStepProps {
  defaultValues: OnboardingDetails | null
  onSave: (details: OnboardingDetails) => void
}

export function DetailsStep({ defaultValues, onSave }: DetailsStepProps): ReactNode {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: defaultValues ?? undefined,
  })

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch('/api/categories')
      if (!res.ok) return []
      const body = (await res.json()) as { categories: string[] }
      return body.categories
    },
  })
  const categories = data ?? []

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="prod-title">Title</Label>
        <Input id="prod-title" aria-invalid={!!errors.title} {...register('title')} />
        <FieldError name="prod-title" message={errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="prod-category">Category</Label>
        <select
          id="prod-category"
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
        <FieldError name="prod-category" message={errors.category?.message} />
      </div>

      <div>
        <Label htmlFor="prod-desc">Description (optional)</Label>
        <textarea
          id="prod-desc"
          rows={3}
          {...register('description')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Continue to pricing
      </button>
    </form>
  )
}
