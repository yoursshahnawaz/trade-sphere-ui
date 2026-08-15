import { describe, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/features/auth/auth-client', () => ({
  authClient: { logout: vi.fn(), login: vi.fn(), register: vi.fn(), registerSeller: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { makeStore } from '@/store'
import { setUser } from '@/features/auth/auth-slice'
import { setCart } from '@/features/cart/cart-slice'
import { setCartDrawerOpen } from '@/store/ui-slice'
import { expectNoAxeViolations } from './axe'

import { ProductCard } from '@/features/catalog/product-card'
import { ProductDetailPanel } from '@/features/catalog/product-detail-panel'
import { Header } from '@/components/layout/header'
import { CheckoutWizard } from '@/features/checkout/checkout-wizard'
import { InventoryTable } from '@/features/seller/inventory-table'
import { OnboardingWizard } from '@/features/seller/onboarding-wizard'
import { LoginForm } from '@/features/auth/login-form'
import { CartDrawer } from '@/features/cart/cart-drawer'
import { PromoCarousel } from '@/features/promo/promo-carousel'
import type { Product, CartLine } from '@/types'

type Store = ReturnType<typeof makeStore>

function renderWith(ui: ReactNode, setup?: (store: Store) => void): void {
  const store = makeStore()
  setup?.(store)
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
    </Provider>,
  )
}

const product: Product = {
  id: 'p1',
  title: 'Wireless Headphones',
  priceCents: 12999,
  stock: 8,
  category: 'audio',
  imageUrl: 'https://picsum.photos/seed/p1/800/800',
  options: [{ name: 'Color', values: ['Black', 'Silver'] }],
}
const saleProduct: Product = { ...product, id: 'p2', title: 'On-Sale Buds', salePriceCents: 9999 }
const line: CartLine = {
  productId: 'p1',
  title: 'Wireless Headphones',
  priceCents: 12999,
  imageUrl: 'https://picsum.photos/seed/p1/800/800',
  stock: 8,
  quantity: 1,
}

describe('a11y (axe)', () => {
  it('ProductCard (regular + sale)', async () => {
    renderWith(
      <>
        <ProductCard product={product} />
        <ProductCard product={saleProduct} />
      </>,
    )
    await expectNoAxeViolations(document.body)
  })

  it('ProductDetailPanel', async () => {
    renderWith(<ProductDetailPanel product={product} />)
    await expectNoAxeViolations(document.body)
  })

  it('Header — buyer', async () => {
    renderWith(<Header />, (s) => s.dispatch(setUser({ uid: 'u1', email: 'buyer@x.com', role: 'buyer' })))
    await expectNoAxeViolations(document.body)
  })

  it('Header — seller with account menu open', async () => {
    renderWith(<Header />, (s) => s.dispatch(setUser({ uid: 'u2', email: 'seller@x.com', role: 'seller' })))
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }))
    await screen.findByText('Log out')
    await expectNoAxeViolations(document.body)
  })

  it('CartDrawer (open, with items)', async () => {
    renderWith(<CartDrawer />, (s) => {
      s.dispatch(setCart([line]))
      s.dispatch(setCartDrawerOpen(true))
    })
    await screen.findByText('Your cart')
    await expectNoAxeViolations(document.body)
  })

  it('PromoCarousel', async () => {
    renderWith(<PromoCarousel />)
    await expectNoAxeViolations(document.body)
  })

  it('CheckoutWizard (cart step)', async () => {
    renderWith(<CheckoutWizard />, (s) => s.dispatch(setCart([line])))
    await expectNoAxeViolations(document.body)
  })

  it('InventoryTable', async () => {
    renderWith(<InventoryTable />)
    await screen.findByText('Wireless Earbuds Pro') // MSW-seeded row
    await expectNoAxeViolations(document.body)
  })

  it('OnboardingWizard', async () => {
    renderWith(<OnboardingWizard />)
    await screen.findByLabelText('Title')
    await expectNoAxeViolations(document.body)
  })

  it('LoginForm', async () => {
    renderWith(<LoginForm />)
    await expectNoAxeViolations(document.body)
  })
})
