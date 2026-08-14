'use client'

import type { ReactNode } from 'react'
import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'

const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', wide: false },
  { name: 'line1', label: 'Address line 1', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2', wide: false },
  { name: 'region', label: 'State / Region', autoComplete: 'address-level1', wide: false },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', wide: false },
  { name: 'country', label: 'Country', autoComplete: 'country-name', wide: false },
] as const

export interface AddressFieldsProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  idPrefix: string
}

export function AddressFields<T extends FieldValues>({
  register,
  errors,
  idPrefix,
}: AddressFieldsProps<T>): ReactNode {
  const fe = errors as Record<string, { message?: unknown } | undefined>
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((f) => {
        const id = `${idPrefix}-${f.name}`
        const raw = fe[f.name]?.message
        const message = typeof raw === 'string' ? raw : undefined
        return (
          <div key={f.name} className={f.wide ? 'sm:col-span-2' : ''}>
            <Label htmlFor={id}>{f.label}</Label>
            <Input
              id={id}
              autoComplete={f.autoComplete}
              aria-invalid={!!message}
              aria-describedby={message ? `${id}-error` : undefined}
              {...register(f.name as Path<T>)}
            />
            <FieldError name={id} message={message} />
          </div>
        )
      })}
    </div>
  )
}
