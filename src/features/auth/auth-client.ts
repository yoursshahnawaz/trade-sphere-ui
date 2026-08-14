'use client'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase-client'
import type { SessionUser } from '@/types'

async function establishSession(user: User): Promise<SessionUser> {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('Failed to establish session')
  const data = (await res.json()) as { user: SessionUser }
  return data.user
}

async function establishSellerSession(user: User, storeName: string): Promise<SessionUser> {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/seller-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, storeName }),
  })
  if (!res.ok) throw new Error('Failed to register seller')
  const data = (await res.json()) as { user: SessionUser }
  return data.user
}

export const authClient = {
  async login(email: string, password: string): Promise<SessionUser> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return establishSession(cred.user)
  },
  async loginWithGoogle(): Promise<SessionUser> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    return establishSession(cred.user)
  },
  async registerBuyer(email: string, password: string): Promise<SessionUser> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return establishSession(cred.user)
  },
  async registerSeller(email: string, password: string, storeName: string): Promise<SessionUser> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return establishSellerSession(cred.user, storeName)
  },
  async registerSellerWithGoogle(storeName: string): Promise<SessionUser> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    return establishSellerSession(cred.user, storeName)
  },
  async logout(): Promise<void> {
    const { auth, ready } = getFirebaseAuth()
    await ready
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
  },
}
