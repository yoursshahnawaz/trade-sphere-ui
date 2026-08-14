import { SignJWT, jwtVerify } from 'jose'
import type { Role } from '@/types'

export interface SessionClaims {
  sub: string
  email?: string
  role: Role
}

const ISS = 'trade-sphere'

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_JWT_SECRET
  if (!raw || Buffer.byteLength(raw) < 32) {
    throw new Error('SESSION_JWT_SECRET must be set to at least 32 bytes')
  }
  return new TextEncoder().encode(raw)
}

export async function createSessionJwt(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer(ISS)
    .setAudience(ISS)
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifySessionJwt(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ['HS256'],
    issuer: ISS,
    audience: ISS,
  })
  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    role: payload.role as Role,
  }
}
