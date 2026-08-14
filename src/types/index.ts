export type { Product } from '@/lib/schemas/product-schema'
export type { CartLine } from '@/lib/schemas/cart-schema'

export type Role = 'buyer' | 'seller'

export interface SessionUser {
  uid: string
  email?: string
  role: Role
}
