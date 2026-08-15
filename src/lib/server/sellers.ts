import { getDb } from './supabase'
import type { SellerRow } from './db-types'

export interface SellerInfo {
  name: string
  location: string
}

const FALLBACK: SellerInfo = { name: 'Independent Seller', location: 'India' }

export async function getSellerInfo(uid: string): Promise<SellerInfo> {
  const { data } = await getDb().from('sellers').select('name, location').eq('uid', uid).maybeSingle()
  const row = data as Pick<SellerRow, 'name' | 'location'> | null
  return row ? { name: row.name, location: row.location } : FALLBACK
}

export async function getSellerName(uid: string): Promise<string> {
  return (await getSellerInfo(uid)).name
}

export async function setSellerInfo(uid: string, info: SellerInfo): Promise<void> {
  await getDb().from('sellers').upsert({ uid, name: info.name, location: info.location })
}

/** Batch seller lookup for the catalog; missing sellers fall back gracefully. */
export async function getSellersMap(uids: string[]): Promise<Map<string, SellerInfo>> {
  const unique = [...new Set(uids)]
  if (unique.length === 0) return new Map()
  const { data } = await getDb().from('sellers').select('uid, name, location').in('uid', unique)
  const rows = (data ?? []) as SellerRow[]
  return new Map(rows.map((r) => [r.uid, { name: r.name, location: r.location }]))
}
