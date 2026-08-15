import type { ProfileInput } from '@/lib/schemas/profile-schema'
import { getDb } from './supabase'

export async function getProfile(uid: string): Promise<ProfileInput | null> {
  const { data } = await getDb().from('profiles').select('name, gender, contact').eq('uid', uid).maybeSingle()
  return (data as ProfileInput | null) ?? null
}

export async function setProfile(uid: string, profile: ProfileInput): Promise<ProfileInput> {
  await getDb()
    .from('profiles')
    .upsert({ uid, name: profile.name, gender: profile.gender, contact: profile.contact })
  return profile
}
