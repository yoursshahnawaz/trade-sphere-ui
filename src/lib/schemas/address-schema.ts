import { z } from 'zod'

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  region: z.string().min(2, 'Select a state'),
  postalCode: z.string().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'),
  country: z.string().min(2, 'Required'),
})
export type Address = z.infer<typeof addressSchema>
