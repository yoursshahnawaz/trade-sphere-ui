import type { Address } from '@/lib/schemas/address-schema'
import { getDb } from './supabase'

interface AddressRow {
  id: string
  full_name: string
  line1: string
  line2: string | null
  city: string
  region: string
  postal_code: string
  country: string
  is_default: boolean
}

function toAddress(r: AddressRow): Address {
  const a: Address = {
    fullName: r.full_name,
    line1: r.line1,
    city: r.city,
    region: r.region,
    postalCode: r.postal_code,
    country: r.country,
  }
  if (r.line2) a.line2 = r.line2
  return a
}

function toRow(uid: string, a: Address): Record<string, unknown> {
  return {
    uid,
    full_name: a.fullName,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    region: a.region,
    postal_code: a.postalCode,
    country: a.country,
  }
}

// Display order (also the index the client operates on): default first, then oldest.
async function orderedRows(uid: string): Promise<AddressRow[]> {
  const { data } = await getDb()
    .from('addresses')
    .select('id, full_name, line1, line2, city, region, postal_code, country, is_default')
    .eq('uid', uid)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
  return (data ?? []) as AddressRow[]
}

export async function listAddresses(uid: string): Promise<Address[]> {
  return (await orderedRows(uid)).map(toAddress)
}

export async function addAddress(uid: string, address: Address): Promise<Address[]> {
  const existing = await orderedRows(uid)
  await getDb()
    .from('addresses')
    .insert({ ...toRow(uid, address), is_default: existing.length === 0 })
  return listAddresses(uid)
}

export async function updateAddress(uid: string, index: number, address: Address): Promise<Address[]> {
  const rows = await orderedRows(uid)
  const target = rows[index]
  if (target) await getDb().from('addresses').update(toRow(uid, address)).eq('id', target.id).eq('uid', uid)
  return listAddresses(uid)
}

export async function setDefaultAddress(uid: string, index: number): Promise<Address[]> {
  const rows = await orderedRows(uid)
  const target = rows[index]
  if (target) {
    await getDb().from('addresses').update({ is_default: false }).eq('uid', uid)
    await getDb().from('addresses').update({ is_default: true }).eq('id', target.id)
  }
  return listAddresses(uid)
}

export async function removeAddress(uid: string, index: number): Promise<Address[]> {
  const rows = await orderedRows(uid)
  const target = rows[index]
  if (target) {
    await getDb().from('addresses').delete().eq('id', target.id).eq('uid', uid)
    if (target.is_default) {
      const remaining = await orderedRows(uid)
      const first = remaining[0]
      if (first) await getDb().from('addresses').update({ is_default: true }).eq('id', first.id)
    }
  }
  return listAddresses(uid)
}
