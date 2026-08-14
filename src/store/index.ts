import { configureStore, type Action, type ThunkAction } from '@reduxjs/toolkit'
import { listenerMiddleware } from './listener'
import uiReducer from './ui-slice'
import authReducer from '@/features/auth/auth-slice'
import cartReducer from '@/features/cart/cart-slice'
// Registers cart lifecycle listeners on the shared listener middleware (side effect).
import '@/features/cart/cart-listeners'

export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
      cart: cartReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action>
