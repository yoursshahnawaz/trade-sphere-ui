'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeStore } from '@/store'
import { getQueryClient } from '@/lib/query/query-client'
import { AuthBootstrap } from '@/features/auth/auth-bootstrap'
import { FirstVisitBootstrap } from '@/features/promo/first-visit-bootstrap'
import { CartPersistor } from '@/features/cart/cart-persistor'
import { CartDrawer } from '@/features/cart/cart-drawer'
import { Toaster } from '@/components/ui/sonner'

export interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps): ReactNode {
  // Lazy initializer: one store per component instance (fresh per request on
  // the server, once in the browser) without accessing a ref during render.
  const [store] = useState(makeStore)

  return (
    <Provider store={store}>
      <QueryClientProvider client={getQueryClient()}>
        <AuthBootstrap />
        <FirstVisitBootstrap />
        <CartPersistor />
        {children}
        <CartDrawer />
        <Toaster />
      </QueryClientProvider>
    </Provider>
  )
}
