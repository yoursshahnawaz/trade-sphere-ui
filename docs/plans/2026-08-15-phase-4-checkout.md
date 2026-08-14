# Phase 4 — Checkout Implementation Plan

> **Executor:** agent with repo context. Compact; inline code only where non-obvious. Test-first for logic. Explicit return types. Remove unused imports (lint gates). `'use client'` only on interactive leaves.
> **Do NOT push/PR/merge.** Ends with a dev-server verification.

**Goal:** A multi-step checkout funnel (Cart → Shipping → Billing → Review) with strict per-step Zod validation, wired to the session + cart; placing an order creates a server-side order, clears the cart, and shows a confirmation page.

**Key decisions:**
- Wizard state = local `useReducer` (transient UI per §3.3), not Redux.
- **Server-authoritative order:** `POST /api/orders` reads the server cart (`getCart(uid)`), computes totals server-side, creates the order, clears the cart. Client sends only `{ shipping, billing, payment }`.
- **No full PAN stored:** card validated client-side; only `{ method, cardLast4 }` sent to the BFF.
- `computeTotals` is pure + unit-tested (subtotal, 8% tax, free shipping ≥ $50 else $5).
- `/checkout` is already proxy-protected; add `/orders/:path*` to the matcher.

---

### T1 — Schemas + totals (test-first)
`src/lib/order-totals.ts`:
```ts
export interface OrderTotals { subtotalCents: number; taxCents: number; shippingCents: number; totalCents: number }
export function computeTotals(subtotalCents: number): OrderTotals {
  const taxCents = Math.round(subtotalCents * 0.08)
  const shippingCents = subtotalCents === 0 ? 0 : subtotalCents >= 5000 ? 0 : 500
  return { subtotalCents, taxCents, shippingCents, totalCents: subtotalCents + taxCents + shippingCents }
}
```
`src/lib/schemas/address-schema.ts`: `addressSchema` (`fullName` min2, `line1` min3, `line2` optional, `city` min2, `region` min2, `postalCode` min3, `country` min2) + `type Address`.
`src/lib/schemas/payment-schema.ts`: `paymentFormSchema` = discriminated union on `method`: `{ method:'card', cardName min2, cardNumber (regex `^\d{13,19}$`), expiry (regex `^(0[1-9]|1[0-2])\/\d{2}$`), cvc (`^\d{3,4}$`) }` | `{ method:'cod' }`. Also `paymentStoredSchema` (what's sent/stored) = discriminated union: `{ method:'card', cardLast4: z.string().regex(/^\d{4}$/) } | { method:'cod' }`.
`src/lib/schemas/order-schema.ts`: `orderInputSchema` = `{ shipping: addressSchema, billing: addressSchema, payment: paymentStoredSchema }`; `orderSchema` (full order: id, items `z.array(cartLineSchema)`, shipping, billing, payment, totals, createdAt) + `type Order`.
Tests: `computeTotals` (tax rounding, free-shipping threshold at exactly 5000, zero); address rejects short fields; payment card requires valid number/expiry/cvc, cod needs none. Commit: `feat: checkout schemas + order totals`.

### T2 — Server orders + routes + MSW (test-first)
`src/lib/server/order-store.ts`: internal `interface StoredOrder extends Order { uid: string }`; `Map<string, StoredOrder>`; `createOrder(input: { uid: string; items: CartLine[]; shipping: Address; billing: Address; payment: PaymentStored; totals: OrderTotals }): StoredOrder` (id via `crypto.randomUUID()`, `createdAt` ISO); `getOrder(id): StoredOrder | undefined`.
`src/app/api/orders/route.ts` — `POST` (`: Promise<NextResponse>`): `isSameOrigin` + `requireSession` (401); parse body via `orderInputSchema` (400); `items = getCart(sub)`; if empty → 400 `{ error:'cart empty' }`; `subtotal = items.reduce((n,i)=>n+i.priceCents*i.quantity,0)`; `totals = computeTotals(subtotal)`; `createOrder({ uid:sub, items, ...body, totals })`; `saveCart(sub, [])` (clear); return `{ order }` 201.
`src/app/api/orders/[id]/route.ts` — `GET` (`await params`): `requireSession`; `getOrder(id)`; if missing or `order.uid !== sub` → 404 (prevents IDOR); return `{ order }`.
MSW handlers for both (test-only). Route test (node, mock `next/headers` + `requireSession`, seed the cart via `saveCart`): order created with correct totals + cart cleared; empty cart → 400; get enforces ownership. Commit: `feat: server orders (create clears cart, ownership) + msw`.

### T3 — Checkout steps + wizard state
`src/features/checkout/checkout-state.ts`: `type Step = 'cart'|'shipping'|'billing'|'review'`; reducer state `{ step, shipping: Address|null, billing: Address|null, sameBilling: boolean, payment: PaymentStored|null }`; actions to save each step's data (each commits data AND advances) + `back`. **No arbitrary `goto`** — forward progress only happens when a step's data is committed, so a user can't skip to Review without valid prior steps. Explicit types. (RHF's default `shouldFocusError` focuses the first invalid field on a failed submit.)
Step components (`'use client'`, RHF + `zodResolver`, inline `FieldError` with `role="alert"`, `aria-invalid`/`aria-describedby`):
- `cart-review-step.tsx` — lists cart lines + `OrderSummary`; "Continue" (disabled if empty).
- `address-form.tsx` — reusable address form (used for shipping and billing); labelled fields.
- `billing-step.tsx` — "Billing same as shipping" checkbox (prefill/skip address) + payment method radios (`card`/`cod`) with conditional card fields (`react-hook-form` + `paymentFormSchema`); on submit derive `cardLast4 = cardNumber.slice(-4)`, store `{ method, cardLast4 }`.
- `review-step.tsx` — read-only summary of shipping/billing/payment(masked) + `OrderSummary` + "Place order".
`src/features/checkout/order-summary.tsx` — subtotal/tax/shipping/total via `computeTotals`, total in an `aria-live="polite"` region. Commit: `feat: checkout steps + wizard state`.

### T4 — Checkout wizard + page
`src/features/checkout/checkout-wizard.tsx` (`'use client'`): **presentational** step indicator (`aria-current="step"`, not clickable), renders the active step, Back button, focus-moves to the step heading on change. Review's "Place order" is **disabled unless `shipping && billing && payment` are all set** and **while a submit is in flight** (an `isPlacing` flag guards double-submit). On "Place order": `POST /api/orders` → on success `dispatch(clearCart())` + `router.push(/orders/<id>)`; on failure show an error toast, do NOT navigate, keep the cart (a second attempt is possible). Reads cart from Redux; empty-cart → render an empty state (link to `/`).
`src/app/checkout/page.tsx` (`'use client'`): renders `<CheckoutWizard />` (route already proxy-protected).
`src/proxy.ts`: add `/orders/:path*` to the matcher. Commit: `feat: checkout wizard + place order`.

### T5 — Order confirmation
`src/app/orders/[id]/page.tsx` (server component, `await params`): `requireSession` → if none `redirect('/login?returnUrl=/orders/<id>')`; `getOrder(id)` → `notFound()` if missing or not owned; render order id, items, shipping address, masked payment, and totals. Commit: `feat: order confirmation page`.

### T6 — Integration test + gate (STOP)
`src/features/checkout/checkout-wizard.test.tsx`: mock `next/navigation` + cart state (Provider with seeded cart) + MSW `/api/orders`; (a) happy path — drive Cart→Shipping→Billing→Review, fill valid fields, place order, assert `router.push('/orders/…')`; (b) invalid step blocks advancement (error shown, still on the step); (c) **MSW returns 500 on POST** → assert error toast shown, `router.push` NOT called, cart not cleared. (Satisfies §3.6 + §7.2 simulated-failure.)
Gate: `npm run build && npm run typecheck && npm run lint && npm test`. `PROGRESS.md` → log line (keep 🟡). `rm -rf .next && npm run dev` → hand off. Verify: guest "Checkout" → login → cart intact → funnel → validation blocks bad input → place order → confirmation → cart cleared.

**STOP.** After the user verifies, push `feat/phase-4-checkout` and open the PR.

---

**Coverage vs spec Phase 4:** structured multi-step funnel Cart→Shipping→Billing→Review (T3/T4), strict field-level address + payment validation before proceeding (T1/T3), server-authoritative order + cart clear (T2), confirmation (T5), integration test of the flow (T6). Reuses Phase-1 auth gating (intent capture on `/checkout`) and Phase-2 cart. Security: no full PAN stored, order totals/items server-derived, order ownership enforced.
