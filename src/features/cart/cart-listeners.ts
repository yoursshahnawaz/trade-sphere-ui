import { startAppListening } from '@/store/listener'
import { loggedIn, loggedOut } from '@/features/auth/auth-slice'
import { mergeGuestCartOnLogin, teardownCart } from './cart-thunks'

// Registered once as a module side-effect (imported from store/index.ts). The
// listener middleware is a process-level singleton, so registration must happen
// once — not per makeStore() call.
let registered = false
if (!registered) {
  registered = true

  startAppListening({
    actionCreator: loggedIn,
    effect: async (_action, api) => {
      api.cancelActiveListeners() // coalesce rapid logins (takeLatest)
      await api.dispatch(mergeGuestCartOnLogin())
    },
  })

  startAppListening({
    actionCreator: loggedOut,
    effect: (_action, api) => {
      api.dispatch(teardownCart())
    },
  })
}
