# Trade-Sphere

A multi-vendor e-commerce marketplace UI — buyers shop across sellers, sellers manage a storefront (analytics, inventory, orders, product onboarding). Built as a production-shaped Next.js app with a strong focus on the assessment NFRs (Core Web Vitals, HTTP-only cookie auth, error boundaries, accessibility, testing).

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind v4** + **shadcn/ui** (Base UI)
- **Redux Toolkit** (cart / auth / ui) + **TanStack Query** (server cache)
- **Supabase** — Postgres (products, orders, profiles, addresses, reviews), Storage (product images), realtime (live catalog)
- **Firebase Auth** (client SDK) → server-verified **HttpOnly session JWT** (`jose`)
- **Zod** schemas (shared client + server), **react-hook-form**
- **recharts** (seller analytics), **@tanstack/react-table v8** (inventory)
- **Vitest** + **Testing Library** + **MSW** + **axe-core**

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

`.env.local` (never committed):

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | Firebase web config (Console → Project settings → Web app) |
| `SESSION_JWT_SECRET` | ≥32-byte secret signing the HttpOnly session JWT (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Dashboard → Project settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key — browser realtime + public catalog reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — server-only; the BFF uses it and enforces authz |
| `NEXT_PUBLIC_SITE_URL` | Optional base URL for metadata/OG links (defaults to `http://localhost:3000`) |

Enable **Email/Password** and **Google** sign-in in Firebase Auth.

### Database

Create a Supabase project, then run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor to create the tables, RLS policies, realtime publication, and the `product-images` Storage bucket. Optionally run [`supabase/seed.sql`](./supabase/seed.sql) to load the demo catalog.

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run once) |
| `npm run test:coverage` | Vitest + v8 coverage report |

## Architecture

- **App Router** (`src/app`) — pages + route handlers. One `<main>` landmark lives in the root layout.
- **Feature folders** (`src/features/*`) — `auth`, `cart`, `catalog`, `promo`, `checkout`, `seller`; each owns its components, hooks, slice, and API seam.
- **BFF over Supabase Postgres** — route handlers (`src/app/api/*`) call server stores (`src/lib/server/*`) that read/write Postgres with the **service-role** key (bypasses RLS; the BFF enforces per-uid scoping). The client sends only ids/quantities and the server re-derives price/stock. RLS exposes only public catalog data (active products, seller info) to the anon key; reviews/orders/addresses/profiles are service-role only.
- **Curated home + browse-all catalog** — home (`/`) is a curated landing (promo, shop-by-category, recently-viewed, top-rated, deals); the full searchable/filterable catalog lives on `/products`. Both draw from every seller's *active* listing, and a new/edited listing appears to buyers **live** via a Supabase realtime subscription (anon client) that invalidates the catalog query. Sale price is a single `effectivePriceCents()` used by display and billing. Seller-uploaded images go to Supabase **Storage**.
- **Schemas** (`src/lib/schemas/*`) — Zod, types inferred, shared across client and server.

## Auth model

Sign in with the Firebase client SDK → POST the ID token to `/api/auth/session`, which **verifies it against Google's JWKS** (`jose`, no Admin SDK) and mints an **HS256 HttpOnly session JWT** (`SameSite=Lax`, `Secure` in prod). `proxy.ts` (the Next 16 renamed middleware, Node runtime) verifies that JWT and gates `/seller/*`, `/checkout`, `/orders` with intent capture + role checks. No tokens are stored in `localStorage`; roles are server-owned; no full card PAN is ever stored (only `{ method, cardLast4 }`).

## Accessibility

- One `<main id="main-content">` landmark + a skip-to-content link; focus moves to main on client-side route changes; distinct `aria-label`s on each `<nav>`; one `<h1>` per route.
- Live regions for cart/checkout totals and validation errors; `role="alert"` field errors; charts pair a canvas with an `sr-only` data table.
- Automated **axe-core** checks over key surfaces and overlays (`src/test/a11y.test.tsx`). `color-contrast` is disabled in jsdom (it can't compute layout/color) and is instead verified out-of-band via an in-browser axe/Lighthouse pass.

## Core Web Vitals

Lighthouse needs a real Chrome and isn't reproducible in this headless env, so CWV is enforced at the code level and verified out-of-band:

- **LCP** — the promo hero image (`preload`) is the LCP element; below-the-fold product images are lazy.
- **CLS** — `next/font` (Geist), fixed-height chart wrappers, and dimension-matched skeletons prevent shift.
- **Images** — `next/image` with `sizes` everywhere; AVIF/WebP enabled in `next.config.ts`.
- **JS** — `recharts` is imported only by seller charts, so it's code-split out of buyer routes.

## Testing

Vitest + Testing Library + MSW. Server-logic tests run in the `node` environment; component tests in jsdom. Coverage is reported (not globally gated — much of the tree is presentational); the checkout step machine has an enforced per-file threshold. Critical logic (state machines, stores, pricing, auth/session, route handlers) is well covered.

## Project docs

- [`DECISIONS.md`](./DECISIONS.md) — ADR-lite rationale for non-obvious choices.
- [`PROGRESS.md`](./PROGRESS.md) — phase-by-phase build log.
- [`docs/plans/`](./docs/plans) — per-phase implementation plans.
