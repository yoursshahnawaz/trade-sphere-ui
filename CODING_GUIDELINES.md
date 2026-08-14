# Technical Coding Guidelines & Engineering Standards

All codebase contributions must strictly adhere to the guidelines defined below to ensure high performance, security, and maintainability.

---

## 1. File Naming & Directory Conventions

1. **Kebab-Case Standard:** All source files, component files, hook files, utility scripts, and documentation files must strictly use kebab-case naming (e.g., `product-card.tsx`, `use-infinite-products.ts`, `cart-slice.ts`).
2. **Directory Matching:** Directory names must also follow kebab-case without exception.

---

## 2. Type Safety & Language Rules

1. **Strict Type Declaration:**
   * The `any` type is strictly prohibited. Use explicit type declarations, interfaces, or generics.
   * All API handlers, component props, and custom hooks must declare explicit return types.
2. **Type Co-location:**
   * Domain-wide entities must reside in `src/types/`.
   * Component-specific prop contracts must be defined within the component file named `[ComponentName]Props`.

---

## 3. Component Construction & Performance Standards

1. **Resilience & Error Boundaries:**
   * Wrap major layout sections and dynamic data-fetching components in `<ErrorBoundary>` to prevent full application crashes.
   * Provide graceful fallback UIs with retry mechanisms for failed asynchronous operations.
2. **Layout Shift Prevention (CLS) & Asset Optimization (LCP):**
   * Structural skeleton loaders must match the precise pixel dimensions of the final loaded components. Render skeletons explicitly during loading states (`isFetching`, `isLoading`).
   * Use Next.js native `<Image>` components exclusively. Enforce modern formats (WebP/AVIF) and use the `priority={true}` attribute for Above-the-Fold (hero) imagery.
3. **State Subscription & Rendering Efficiency:**
   * Use atomic selectors in Redux to read state slice properties individually, preventing blanket component re-renders.
   * Co-locate transient UI state to the lowest possible component node in the React tree.

---

## 4. Form Management & Schema Validation Rules

1. **Validation Engine:**
   * All forms must utilize uncontrolled component integrations (`react-hook-form`) with schema validation resolvers to prevent keystroke re-renders.
2. **Schema Declaration Standard:**
   * Define all validation schemas in `src/lib/schemas/` using Zod.
   * Export inferred TypeScript types directly from the schema definition to ensure a single source of truth across the frontend and API layers.

---

## 5. Security & Session Standards

1. **Token Storage & Persistence:**
   * Do not write authentication tokens, access keys, or secure user session data to browser storage engines (`localStorage` or `sessionStorage`).
   * Session state must be verified on HTTP requests carrying secure, HTTP-only, SameSite session cookies managed by server middleware.
2. **Guest Cart State:**
   * `localStorage` may only be used for non-sensitive data, such as persisting an unauthenticated guest cart before the login merge sequence.
3. **Sanitization:**
   * Never inject un-sanitized string values into dangerous HTML render props (e.g., `dangerouslySetInnerHTML`).

---

## 6. Accessibility (a11y) Standards

1. **Keyboard Traps & ARIA Attributes:**
   * All interactive controls (carousels, multi-step forms, drawers) must be fully operable via keyboard navigation (Tab, Enter, Space, Arrow keys).
   * Dynamic dropdowns and side-drawers must declare `aria-expanded` and appropriate structural role attributes.
   * Live updating elements (e.g., cart quantity badges, checkout totals) must declare `aria-live="polite"` to notify screen readers dynamically.
2. **Semantic HTML:**
   * Always prefer native semantic elements (`<button>`, `<nav>`, `<article>`, `<header>`) over generic container elements with attached click listeners.

---

## 7. Testing Standards

1. **Unit Testing:**
   * Focus on reducer pure functions, complex state merging logic (e.g., Guest Cart to Authenticated Cart merging), and schema validation rule execution.
2. **Integration Testing:**
   * Test primary user workflows (checkout funnel, multi-step product creation) through DOM interaction events.
   * Intercept all outbound network calls using network-level interceptor tools (MSW) to validate optimistic updates and error boundary fallbacks under simulated failure conditions.

---

## 8. Directory & Architecture Conventions

1. **Feature-based structure:** Group code by domain feature, not by file type.
   ```
   src/
     app/                  # routes, layouts, route handlers (/api/*)
     components/ui/        # shadcn primitives
     components/           # shared cross-feature components
     features/<feature>/   # components, hooks, api, slice for one domain
     lib/{schemas,server,query}/
     store/                # configureStore + listener middleware
     types/                # domain-wide entities
     mocks/                # MSW handlers + seed data
   ```
2. **Boundaries:** A feature owns its slice, hooks, and components. Cross-feature reuse goes through `components/` or `lib/`, never by importing another feature's internals.
3. **Server code isolation:** All server-only logic (Firebase Admin, session verification, mock persistence) lives under `src/lib/server/` and `src/app/api/` so it stays cleanly extractable.

---

## 9. Server vs Client Component Discipline (App Router)

1. **Default to Server Components.** Add `'use client'` only at the lowest interactive leaf that needs state, effects, or browser APIs.
2. **Keep data fetching server-side** (server components / route handlers) where possible; reserve TanStack Query for genuinely client-driven fetching (infinite scroll, optimistic mutations).
3. **Never** pass non-serializable values across the server→client boundary, and never import server-only modules (`firebase-admin`) into client components.

---

## 10. Accessible UI Primitives

1. **Use shadcn/ui (Radix) primitives** for Dialog, Drawer, Dropdown, Tabs, and similar interactive overlays rather than hand-rolling focus management and ARIA wiring.
2. Extend primitives via composition; do not fork their accessibility behavior. Custom widgets (e.g., the promo carousel) must still meet the Section 6 keyboard/ARIA standards.

---

## 11. Commit & Branch Conventions

1. **Conventional Commits:** `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:` — imperative, present tense.
2. **Branch per phase:** `feat/phase-N-<name>`; `main` is the integration branch. Each phase ships as a PR that must pass `typecheck + lint + test` before merge.
3. Commits and PRs carry no AI-assistant attribution.