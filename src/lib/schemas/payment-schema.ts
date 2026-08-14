import { z } from 'zod'

// What the form collects (full card, client-side only — never sent to the server).
export const paymentFormSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('card'),
    cardName: z.string().min(2, 'Required'),
    cardNumber: z.string().regex(/^\d{13,19}$/, 'Enter a valid card number'),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY'),
    cvc: z.string().regex(/^\d{3,4}$/, '3–4 digits'),
  }),
  z.object({ method: z.literal('cod') }),
])
export type PaymentForm = z.infer<typeof paymentFormSchema>

// What is sent to / stored by the server (no full PAN).
export const paymentStoredSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('card'), cardLast4: z.string().regex(/^\d{4}$/) }),
  z.object({ method: z.literal('cod') }),
])
export type PaymentStored = z.infer<typeof paymentStoredSchema>
