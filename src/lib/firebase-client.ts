'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, setPersistence, inMemoryPersistence, type Auth } from 'firebase/auth'

let cached: { auth: Auth; ready: Promise<void> } | null = null

/**
 * Lazily initialize Firebase Auth. Called only from event handlers (client), so
 * nothing runs during SSR/prerender. inMemoryPersistence is DELIBERATE — no token
 * is stored in localStorage/IndexedDB (CODING_GUIDELINES §5.1); the HttpOnly
 * cookie is the session of record, re-hydrated via /api/auth/me. Do NOT switch
 * to browserLocalPersistence.
 */
export function getFirebaseAuth(): { auth: Auth; ready: Promise<void> } {
  if (cached) return cached
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      })
  const auth = getAuth(app)
  cached = { auth, ready: setPersistence(auth, inMemoryPersistence) }
  return cached
}
