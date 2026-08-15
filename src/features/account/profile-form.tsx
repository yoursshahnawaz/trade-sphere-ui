'use client'

import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import { profileSchema, GENDERS, GENDER_LABELS, type ProfileInput } from '@/lib/schemas/profile-schema'
import { fetchProfile, saveProfile } from './account-api'

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ProfileForm(): ReactNode {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: data ?? { name: '', gender: 'prefer-not', contact: '' },
  })

  async function onSubmit(values: ProfileInput): Promise<void> {
    try {
      await saveProfile(values)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile saved.')
    } catch {
      toast.error('Could not save your profile.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="acc-name">Full name</Label>
        <Input id="acc-name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
        <FieldError name="acc-name" message={errors.name?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="acc-gender">Gender</Label>
          <select id="acc-gender" {...register('gender')} className={selectClass}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="acc-contact">Mobile number</Label>
          <Input
            id="acc-contact"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile"
            aria-invalid={!!errors.contact}
            {...register('contact')}
          />
          <FieldError name="acc-contact" message={errors.contact?.message} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isSubmitting ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
