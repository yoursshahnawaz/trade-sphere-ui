// Recently-viewed product ids, newest first. This is a UX convenience (not
// session/auth data), so localStorage is appropriate and survives reloads.
const KEY = 'ts_recently_viewed'
const CAP = 8

export function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function recordRecentlyViewed(id: string): void {
  if (typeof window === 'undefined') return
  const next = [id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, CAP)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage full / unavailable — non-critical, ignore
  }
}
