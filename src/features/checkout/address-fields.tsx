'use client'

import type { ReactNode } from 'react'
import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Japan',
  'Brazil',
  'Other',
]

interface FieldDef {
  name: string
  label: string
  autoComplete?: string
  wide?: boolean
  type?: 'text' | 'select'
}
const FIELDS: FieldDef[] = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'line1', label: 'Address line 1', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'region', label: 'State / Region', autoComplete: 'address-level1' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name', type: 'select' },
]

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
            {f.type === 'select' ? (
              <select
                id={id}
                autoComplete={f.autoComplete}
                aria-invalid={!!message}
                aria-describedby={message ? `${id}-error` : undefined}
                {...register(f.name as Path<T>)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={id}
                autoComplete={f.autoComplete}
                aria-invalid={!!message}
                aria-describedby={message ? `${id}-error` : undefined}
                {...register(f.name as Path<T>)}
              />
            )}
            <FieldError name={id} message={message} />
          </div>
        )
      })}
    </div>
  )
}
