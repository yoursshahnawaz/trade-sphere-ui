import type { ProfileInput } from '@/lib/schemas/profile-schema'

const g = globalThis as unknown as { __userProfiles?: Map<string, ProfileInput> }
const profiles = g.__userProfiles ?? (g.__userProfiles = new Map<string, ProfileInput>())

export function getProfile(uid: string): ProfileInput | null {
  return profiles.get(uid) ?? null
}

export function setProfile(uid: string, profile: ProfileInput): ProfileInput {
  profiles.set(uid, profile)
  return profile
}
