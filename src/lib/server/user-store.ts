import type { Role } from '@/types'

export interface StoredUser {
  uid: string
  email?: string
  role: Role
  storeName?: string
}

export interface UpsertInput {
  uid: string
  email?: string
  role?: Role
  storeName?: string
}

// In-memory store keyed by Firebase uid. Swappable for a real DB later.
const users = new Map<string, StoredUser>()

/**
 * Owns the role-merge rule: an existing user is returned unchanged (role is
 * never upgraded on a repeat call); a new user is created with the given role,
 * defaulting to 'buyer'. Only the seller-register endpoint passes role:'seller'.
 */
export function upsertUser(input: UpsertInput): StoredUser {
  const existing = users.get(input.uid)
  if (existing) return existing
  const created: StoredUser = {
    uid: input.uid,
    email: input.email,
    role: input.role ?? 'buyer',
    storeName: input.storeName,
  }
  users.set(input.uid, created)
  return created
}

export function getUser(uid: string): StoredUser | undefined {
  return users.get(uid)
}
