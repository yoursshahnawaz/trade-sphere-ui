import { z } from 'zod'

export const GENDERS = ['female', 'male', 'other', 'prefer-not'] as const
export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  'prefer-not': 'Prefer not to say',
}

export const profileSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  gender: z.enum(GENDERS),
  // Optional Indian 10-digit mobile (empty allowed).
  contact: z.union([
    z.literal(''),
    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  ]),
})
export type ProfileInput = z.infer<typeof profileSchema>
