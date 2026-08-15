import { describe, it, expect } from 'vitest'
import { addressSchema } from './address-schema'
import { paymentFormSchema, paymentStoredSchema } from './payment-schema'

const validAddress = {
  fullName: 'Ada Lovelace',
  line1: '12 MG Road',
  city: 'Bengaluru',
  region: 'Karnataka',
  postalCode: '560001',
  country: 'India',
}

describe('addressSchema', () => {
  it('accepts a valid address', () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true)
  })
  it('rejects short required fields', () => {
    expect(addressSchema.safeParse({ ...validAddress, fullName: 'A' }).success).toBe(false)
    expect(addressSchema.safeParse({ ...validAddress, line1: '' }).success).toBe(false)
  })
})

describe('paymentFormSchema', () => {
  it('accepts a valid card', () => {
    const r = paymentFormSchema.safeParse({
      method: 'card',
      cardName: 'Ada Lovelace',
      cardNumber: '4242424242424242',
      expiry: '12/29',
      cvc: '123',
    })
    expect(r.success).toBe(true)
  })
  it('rejects a bad card number / expiry / cvc', () => {
    expect(
      paymentFormSchema.safeParse({ method: 'card', cardName: 'A B', cardNumber: '12', expiry: '13/29', cvc: '1' }).success,
    ).toBe(false)
  })
  it('accepts cod with no card fields', () => {
    expect(paymentFormSchema.safeParse({ method: 'cod' }).success).toBe(true)
  })
})

describe('paymentStoredSchema', () => {
  it('requires a 4-digit last4 for card', () => {
    expect(paymentStoredSchema.safeParse({ method: 'card', cardLast4: '4242' }).success).toBe(true)
    expect(paymentStoredSchema.safeParse({ method: 'card', cardLast4: '42' }).success).toBe(false)
  })
})
