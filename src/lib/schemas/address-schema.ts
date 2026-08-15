import { z } from 'zod'

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  region: z.string().min(2, 'Required'),
  postalCode: z.string().min(3, 'Required'),
  country: z.string().min(2, 'Required'),
})
export type Address = z.infer<typeof addressSchema>
