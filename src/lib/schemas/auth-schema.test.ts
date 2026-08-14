import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, sellerRegisterSchema } from './auth-schema'

describe('loginSchema', () => {
  it('accepts a valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })
  it('rejects a bad email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = { email: 'a@b.com', password: 'secret1', confirmPassword: 'secret1' }
  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects a short password', () => {
    expect(registerSchema.safeParse({ ...valid, password: '123', confirmPassword: '123' }).success).toBe(false)
  })
  it('rejects mismatched passwords on confirmPassword', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'other1' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(['confirmPassword'])
  })
})

describe('sellerRegisterSchema', () => {
  const valid = { email: 'a@b.com', password: 'secret1', confirmPassword: 'secret1', storeName: 'My Store' }
  it('accepts a valid seller registration', () => {
    expect(sellerRegisterSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects a missing store name', () => {
    expect(sellerRegisterSchema.safeParse({ ...valid, storeName: '' }).success).toBe(false)
  })
})
