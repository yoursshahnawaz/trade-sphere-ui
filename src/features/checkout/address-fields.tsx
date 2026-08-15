'use client'

import type { ReactNode } from 'react'
import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field-error'
import { INDIAN_STATES } from '@/lib/india'

interface FieldDef {
  name: string
  label: string
  autoComplete?: string
  wide?: boolean
  kind?: 'text' | 'state' | 'country'
  inputMode?: 'text' | 'numeric'
}
const FIELDS: FieldDef[] = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'line1', label: 'Address line 1', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'region', label: 'State', autoComplete: 'address-level1', kind: 'state' },
  { name: 'postalCode', label: 'PIN code', autoComplete: 'postal-code', inputMode: 'numeric' },
  { name: 'country', label: 'Country', autoComplete: 'country-name', kind: 'country' },
]

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-70'

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
        const name = f.name as Path<T>
        return (
          <div key={f.name} className={f.wide ? 'sm:col-span-2' : ''}>
            <Label htmlFor={id}>{f.label}</Label>
            {f.kind === 'state' ? (
              <select
                id={id}
                autoComplete={f.autoComplete}
                aria-invalid={!!message}
                aria-describedby={message ? `${id}-error` : undefined}
                defaultValue=""
                {...register(name)}
                className={selectClass}
              >
                <option value="" disabled>
                  Select a state…
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : f.kind === 'country' ? (
              // Trade-Sphere ships within India only — country is fixed.
              <select
                id={id}
                autoComplete={f.autoComplete}
                {...register(name)}
                className={selectClass}
                aria-readonly="true"
              >
                <option value="India">India</option>
              </select>
            ) : (
              <Input
                id={id}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                aria-invalid={!!message}
                aria-describedby={message ? `${id}-error` : undefined}
                {...register(name)}
              />
            )}
            <FieldError name={id} message={message} />
          </div>
        )
      })}
    </div>
  )
}
