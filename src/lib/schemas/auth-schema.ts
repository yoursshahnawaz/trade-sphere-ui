import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

const registerBase = z.object({
  email: z.email(),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
})

const passwordsMatch = (d: { password: string; confirmPassword: string }): boolean =>
  d.password === d.confirmPassword
const matchError = { message: 'Passwords do not match', path: ['confirmPassword'] }

export const registerSchema = registerBase.refine(passwordsMatch, matchError)
export type RegisterInput = z.infer<typeof registerSchema>

export const sellerRegisterSchema = registerBase
  .extend({ storeName: z.string().min(2, 'Store name is too short') })
  .refine(passwordsMatch, matchError)
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>
