import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? ''

// Google's JWK-format endpoint for Firebase ID tokens (NOT the x509 one).
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

export interface FirebaseIdToken extends JWTPayload {
  sub: string
  email?: string
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdToken> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
    algorithms: ['RS256'],
  })
  if (!payload.sub) throw new Error('Firebase ID token missing sub')
  return payload as FirebaseIdToken
}
