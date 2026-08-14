# Architecture Decision Log

Short records of non-obvious engineering choices: **what** was decided, the **alternatives** considered, and **why**. Newest entries at the bottom of each phase. Format is intentionally lightweight (ADR-lite).

---

## Phase 0 — Foundation

### D1 — Framework: Next.js App Router
- **Alternatives:** Vite + React SPA, Remix.
- **Decision:** Next.js App Router + TypeScript.
- **Why:** The requirements map directly onto Next.js primitives — routing middleware for smart auth interception, `next/image` for the LCP/CLS bar, HTTP-only cookies via route handlers, and SSR/streaming for Core Web Vitals. A Vite SPA would need a separate server just to satisfy the cookie-auth and SSR-perf requirements; Next.js gives us a real server layer in one app.

### D2 — Identity: Firebase client + HTTP-only session cookie
- **⚠️ Superseded by D9** (we verify the ID token via Google JWKS and mint our own JWT instead of using Admin `createSessionCookie`).
- **Alternatives:** Firebase client tokens held in the browser; a fully custom auth backend.
- **Decision:** Sign in with the Firebase client SDK, exchange the ID token for a server-minted **session cookie** (`firebase-admin` `createSessionCookie`) set **HttpOnly + Secure + SameSite=Lax**.
- **Why:** The problem statement forbids storing session data in `localStorage`/`sessionStorage` and mandates HTTP-only cookies synchronized with routing middleware. Firebase Auth alone persists tokens client-side; the cookie exchange makes the **server-managed cookie the source of truth**, satisfying the security requirement while keeping Firebase's low-effort identity.

### D3 — Middleware verification: Edge presence-check + server-side verify
- **⚠️ Superseded by D9** (our session token is our own JWT, so Edge middleware can fully verify it with `jose` — no presence-only compromise needed).
- **Alternatives:** Full cryptographic verification inside Edge middleware.
- **Decision:** Edge middleware only checks the session cookie's **presence** (and handles redirect + intent capture); **full verification** (`verifySessionCookie`) and role checks happen in the Node server layer.
- **Why:** `firebase-admin` uses Node APIs and cannot run in the Edge runtime where middleware executes. Splitting responsibilities keeps middleware fast and Edge-safe while still enforcing real verification where data is accessed. (Fallback if we ever need in-middleware verification: mint our own short-lived JWT and verify with `jose`.)

### D4 — Backend: in-app route-handler BFF (not a separate service)
- **Alternatives:** A dedicated standalone backend service + real database.
- **Decision:** Next.js **route handlers as a mock BFF** over seed data, with server code bounded in `src/lib/server/` + `src/app/api/`.
- **Why:** Speed is the stated priority and this is a UI-focused assessment. The route handlers are already a genuine Node server (running `firebase-admin`), so this is not a stub. Clean boundaries mean the server can be lifted into a standalone service later without rewriting the frontend.

### D5 — State ownership: Redux for cart, TanStack Query for server data
- **Alternatives:** Cart in TanStack Query with optimistic mutations; a single state tool for everything.
- **Decision:** **Redux Toolkit** owns `cart`/`auth`/`ui` (cart optimism lives in the slice); **TanStack Query** owns server-fetched data (catalog, product, analytics, orders). The cart is **not** a Query.
- **Why:** The heavy cart requirements (guest persistence, guest→auth merge, logout teardown, rehydrate) are client-state lifecycle concerns better modeled in Redux. Mixing Redux cart with TanStack optimistic updates (as the original plan did) creates two sources of truth for the cart.

### D6 — Dropped: redux-saga, redux-persist, nookies
- **Decision:** Use `createListenerMiddleware` (not saga) for login-merge/logout-teardown; a small store subscription (not redux-persist) for guest-cart persistence; Next's native `cookies()` (not nookies).
- **Why:** YAGNI. Saga is unnecessary weight when RTK ships listener middleware; redux-persist is notoriously fragile with App Router SSR hydration; `nookies` is redundant because HTTP-only cookies must be set server-side, which `cookies()` already handles.

### D7 — UI primitives: shadcn/ui (Base UI)
- **Alternatives:** Hand-rolled accessible components on plain Tailwind.
- **Decision:** shadcn/ui for Dialog/Drawer/Dropdown/Tabs. **Note (corrected at implementation):** the installed shadcn CLI (v4.18) defaults to the `base-nova` style backed by **`@base-ui/react`**, not Radix — so import primitives from `@base-ui/react`, never `@radix-ui/*` (not installed).
- **Why:** The a11y requirements (keyboard-operable carousels/drawers, focus traps, `aria-expanded`) are hard and error-prone to hand-roll. Base UI provides correct behavior out of the box while staying pure Tailwind and copy-in (no heavy dependency).

### D8 — Package manager: npm
- **Decision:** Use npm (Node 24 / npm 11 already installed); do not install pnpm.
- **Why:** Avoids extra setup; no monorepo or workspace needs that would justify pnpm here.

---

## Phase 1 — Auth & routing

### D9 — Session: verify Firebase ID token via Google JWKS + our own HttpOnly JWT (no Admin SDK)
- **Supersedes D2 & D3.**
- **Alternatives:** Firebase Admin `createSessionCookie` (needs a service-account secret); Firebase Auth Emulator (needs Firebase CLI + Java).
- **Decision:** Client signs in with Firebase (email/password + Google) → sends the ID token to `POST /api/auth/session` → server verifies it against **Google's public keys with `jose`** (no service account) → mints our own **HS256 session JWT** (`{ sub: uid, email, role }`) set **HttpOnly + Secure(prod) + SameSite=Lax**. `proxy.ts` verifies this JWT directly with `jose`.
- **Why:** Only the **public** Firebase web config is needed (no secret to manage), and because the session token is our own JWT the **proxy can fully verify it** rather than a presence-only check — a cleaner solve than D3.
- **Runtime correction:** Next 16 renamed `middleware.ts` → **`proxy.ts`**, which defaults to the **Node.js runtime** (the `runtime` config is unavailable and throws). The earlier "Edge" framing is dropped; `jose` runs fine on Node 24, so the JWKS + self-minted-JWT design is unchanged. Role is assigned **server-side by endpoint** (`/api/auth/seller-register` is the only path granting `seller`), never trusted from the login body.

### D10 — Sign-in methods: Email/Password + Google
- **Decision:** Support both email/password and Google OAuth (`signInWithPopup`).
- **Why:** Requested; demonstrates classic credential and federated auth. Firebase manages the credential store — we never store passwords.

### D11 — App data store: in-app BFF keyed by `uid`
- **Alternatives:** Supabase (Postgres), Firestore.
- **Decision:** Store role/profile (and later products/orders) in the Next.js BFF keyed by Firebase `uid`; role is embedded in the session JWT at login.
- **Why:** Speed; matches D4; cleanly swappable to Supabase/Firestore later. Role can't be a Firebase custom claim without the Admin SDK, so it lives here.

### D12 — Role model: one role per account, separate seller signup
- **Alternatives:** Single account with a later "become a seller" onboarding (users can be both).
- **Decision:** One role per account. Buyers register at `/register`, sellers at `/seller/register` (+ store name); the route sets the role. Shared `/login`; post-login routing by role (seller → `/seller`, buyer → returnUrl or `/`).
- **Why:** Matches the spec's isolated seller routing and is the simplest way to demo both personas from fresh accounts.
