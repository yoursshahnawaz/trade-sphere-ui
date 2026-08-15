import type { Role } from '@/types'
import { getDb } from './supabase'

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

interface UserRow {
  uid: string
  email: string | null
  role: Role
  store_name: string | null
}

function toUser(r: UserRow): StoredUser {
  const u: StoredUser = { uid: r.uid, role: r.role }
  if (r.email) u.email = r.email
  if (r.store_name) u.storeName = r.store_name
  return u
}

export async function getUser(uid: string): Promise<StoredUser | undefined> {
  const { data } = await getDb()
    .from('users')
    .select('uid, email, role, store_name')
    .eq('uid', uid)
    .maybeSingle()
  return data ? toUser(data as UserRow) : undefined
}

/**
 * Owns the role-merge rule: an existing user keeps their stored role (never
 * upgraded on a repeat call — `ignoreDuplicates` no-ops on conflict); a new user
 * is created with the given role, defaulting to 'buyer'. Only the seller-register
 * endpoint passes role:'seller'.
 */
export async function upsertUser(input: UpsertInput): Promise<StoredUser> {
  await getDb()
    .from('users')
    .upsert(
      {
        uid: input.uid,
        email: input.email ?? null,
        role: input.role ?? 'buyer',
        store_name: input.storeName ?? null,
      },
      { onConflict: 'uid', ignoreDuplicates: true },
    )
  const stored = await getUser(input.uid)
  // getUser resolves after the upsert (existing row or the one just inserted).
  return stored ?? { uid: input.uid, role: input.role ?? 'buyer' }
}
