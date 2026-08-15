export interface SellerInfo {
  name: string
  location: string
}

// Demo storefronts that own the seed catalog. A real logged-in seller's products
// are attributed to their profile (set from the profile page); until then they
// fall back to a generic identity.
const DEMO: Record<string, SellerInfo> = {
  'seller-soundwave': { name: 'SoundWave Audio', location: 'Bengaluru' },
  'seller-peripia': { name: 'Peripia Tech', location: 'Pune' },
  'seller-wearably': { name: 'Wearably', location: 'Mumbai' },
  'seller-homeglow': { name: 'HomeGlow', location: 'New Delhi' },
  'seller-playzone': { name: 'PlayZone', location: 'Hyderabad' },
}

export const DEMO_SELLER_UIDS = Object.keys(DEMO)

// Shared via globalThis so seller profile edits are visible to the buyer catalog in dev.
const globalForSellers = globalThis as unknown as { __sellerProfiles?: Map<string, SellerInfo> }
const profiles =
  globalForSellers.__sellerProfiles ?? (globalForSellers.__sellerProfiles = new Map(Object.entries(DEMO)))

export function getSellerInfo(uid: string): SellerInfo {
  return profiles.get(uid) ?? { name: 'Independent Seller', location: 'India' }
}

export function getSellerName(uid: string): string {
  return getSellerInfo(uid).name
}

export function setSellerInfo(uid: string, info: SellerInfo): void {
  profiles.set(uid, info)
}
