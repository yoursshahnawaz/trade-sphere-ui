import { z } from 'zod'
import type { ProfileInput } from '@/lib/schemas/profile-schema'
import { addressSchema, type Address } from '@/lib/schemas/address-schema'

export async function fetchProfile(): Promise<ProfileInput | null> {
  const res = await fetch('/api/account')
  if (!res.ok) return null
  return ((await res.json()) as { profile: ProfileInput | null }).profile
}

export async function saveProfile(input: ProfileInput): Promise<ProfileInput> {
  const res = await fetch('/api/account', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to save profile')
  return ((await res.json()) as { profile: ProfileInput }).profile
}

const addressesRes = z.object({ addresses: z.array(addressSchema) })

export async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch('/api/addresses')
  if (!res.ok) return []
  return addressesRes.parse(await res.json()).addresses
}

export async function addAddressReq(a: Address): Promise<Address[]> {
  const res = await fetch('/api/addresses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(a),
  })
  if (!res.ok) throw new Error('Failed to add address')
  return addressesRes.parse(await res.json()).addresses
}

export async function updateAddressReq(index: number, a: Address): Promise<Address[]> {
  const res = await fetch(`/api/addresses?index=${index}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(a),
  })
  if (!res.ok) throw new Error('Failed to update address')
  return addressesRes.parse(await res.json()).addresses
}

export async function deleteAddressReq(index: number): Promise<Address[]> {
  const res = await fetch(`/api/addresses?index=${index}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete address')
  return addressesRes.parse(await res.json()).addresses
}
