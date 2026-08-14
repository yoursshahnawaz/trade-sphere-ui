import { configureStore } from '@reduxjs/toolkit'
import { listenerMiddleware } from './listener'
import uiReducer from './ui-slice'
import authReducer from '@/features/auth/auth-slice'

export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
