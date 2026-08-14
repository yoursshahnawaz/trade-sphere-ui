# Comprehensive Implementation Plan

This document provides a detailed, step-by-step execution roadmap for project development, specifically incorporating advanced state merging, smart routing, performance optimizations, and analytics. Phases must be executed sequentially.

---

## Phase 1: Environment, Tooling & Core Infrastructure

### Step 1.1: Project Initialization & Configuration
* Initialize Next.js App Router workspace with strict TypeScript configuration.
* Configure path aliases (`@/*` -> `./src/*`).
* Install core dependencies:
  * **Framework:** `next`, `react`, `react-dom`
  * **State & Data:** `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`
  * **Auth:** `firebase`, `nookies`
  * **Forms & Validation:** `react-hook-form`, `zod`, `@hookform/resolvers`
  * **UI & Styling:** `tailwindcss`, `lucide-react`, `embla-carousel-react` (for promotional carousel), `recharts` (for seller analytics)
  * **Error Handling:** `react-error-boundary`
* Install testing utilities: `vitest`, `@testing-library/react`, `msw`.

### Step 1.2: Global Store & Error Boundary Setup
* Setup Redux `configureStore` with slices for `cartSlice`, `uiSlice`, and `authSlice`.
* Configure TanStack Query client with global `onError` handlers and retry logic for graceful network degradation.
* Wrap the root layout in `<ErrorBoundary>` to catch unhandled rendering exceptions and provide a global fallback UI.

---

## Phase 2: Authentication & Smart Routing Engine

### Step 2.1: Secure Session Sync
* Setup Firebase Client SDK.
* Implement API Route (`/api/auth/session`) to exchange Firebase ID tokens for HTTP-only, secure, SameSite cookies.
* Bind an `onIdTokenChanged` listener to automate token refresh and sync with the Next.js backend.

### Step 2.2: Smart Interception & Redirection
* Implement Next.js `middleware.ts` to protect `/seller/*` and `/checkout` routes.
* **Intent Capture:** When an unauthenticated user hits a protected route, middleware appends the requested URL as a search parameter (e.g., `/login?returnUrl=/checkout`).
* **Post-Login Routing:** Update the authentication handler to parse `returnUrl` and seamlessly redirect the user back to their intended destination via `useRouter().push()`.

---

## Phase 3: Advanced Cart Persistence & State Merging

### Step 3.1: Guest Cart Implementation
* Configure `cartSlice` to persist unauthenticated cart data to `localStorage` (or a guest cookie) dynamically.
* Ensure cart updates (add/remove/modify) instantly reflect in the UI via Redux.

### Step 3.2: Cart Merging Engine (Login Transition)
* Implement a Redux Thunk or Saga triggered upon successful authentication.
* **Merge Logic:** Read the guest cart from local storage. Send a merge request to the server API with the guest items. Overwrite the Redux store with the newly merged server response.
* Clear the local guest cart storage immediately after successful synchronization.

### Step 3.3: Session Teardown (Logout Transition)
* Bind a listener to the logout action.
* **Teardown Logic:** Instantly clear the `cartSlice` in Redux, remove any local storage cart backups, and invalidate all TanStack Query caches related to user profile and cart data to ensure zero state leakage.

---

## Phase 4: Buyer Experience & Performance Implementations

### Step 4.1: Promotional Carousel & Targeting
* Build a `PromoCarousel` component using `embla-carousel-react`.
* Implement targeting logic (e.g., reading a `isFirstVisit` cookie or `authStatus` from Redux) to dynamically filter which promotional banners are rendered.

### Step 4.2: Infinite Scroll Catalog & Skeleton Loaders
* Implement `useInfiniteQuery` coupled with `IntersectionObserver` for paginated fetching.
* **CLS Prevention:** Create a `ProductSkeletonCard` component matching the exact pixel dimensions of a loaded product card. Render these skeletons aggressively while `isFetchingNextPage` is true.
* **Image Optimization:** Enforce the use of Next.js `<Image>` component for all product thumbnails, explicitly enabling WebP/AVIF formats and setting `priority={true}` for Above-the-Fold images to optimize LCP.

### Step 4.3: Resilience & Optimistic Updates
* Implement optimistic UI updates in TanStack Query for "Add to Cart" actions (update cart count instantly, rollback if the network request fails).
* Wrap product feed segments in specific `<ErrorBoundary>` components to ensure one failing API endpoint doesn't crash the entire catalog view.

---

## Phase 5: Seller Portal & Analytics Dashboard

### Step 5.1: Data Visualization & Analytics
* Setup mock API endpoints returning timeseries data for sales and revenue.
* Implement the `SellerDashboard` utilizing `recharts` to render responsive Line Charts (revenue over time) and Bar Charts (top-selling products).

### Step 5.2: Multi-Step Product Onboarding Form
* Construct a highly controlled, 3-step wizard using `react-hook-form`.
* Implement Zod schema validation at every step boundary before allowing progression.
* Implement a drag-and-drop image uploader interface with local file previews (`URL.createObjectURL`) before uploading.

### Step 5.3: Inventory Data Table
* Implement an inventory table with client-side sorting and filtering.
* Add dynamic status badges (e.g., Green for "In Stock", Red for "Out of Stock") calculating status derived from the inventory count integer.

---

## Phase 6: Testing, Quality Assurance & Handover

### Step 6.1: Unit & Integration Testing
* Write unit tests for the cart merging logic (ensuring guest + auth carts sum correctly and handle duplicates).
* Write integration tests utilizing MSW to simulate API failures and verify that Error Boundaries and optimistic rollbacks trigger correctly.

### Step 6.2: Core Web Vitals Audit
* Run a local Lighthouse audit (production build).
* Validate strict adherence to LCP (< 2.5s), CLS (< 0.1), and keyboard navigability across the carousel, modal drawers, and multi-step forms.