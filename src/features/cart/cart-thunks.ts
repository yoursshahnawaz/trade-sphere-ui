import { toast } from 'sonner'
import type { AppThunk } from '@/store'
import type { CartLine } from '@/types'
import { addItem, setQuantity, removeItem, setCart, clearCart } from './cart-slice'
import { getCart, putCart, mergeCart } from './cart-api'
import { loadGuestCart, clearGuestCart } from './cart-storage'

/** Optimistic add. Authenticated adds persist to the server and roll back just
 * this line on failure. Guest adds are local-only (persisted by the persistor). */
export function addToCart(line: CartLine): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const prev = getState().cart.items.find((i) => i.productId === line.productId)
    dispatch(addItem(line))
    if (getState().auth.status !== 'authenticated') return
    try {
      await putCart(getState().cart.items)
    } catch {
      if (prev) dispatch(setQuantity({ productId: line.productId, quantity: prev.quantity }))
      else dispatch(removeItem(line.productId))
      toast.error('Could not sync your cart. Please try again.')
    }
  }
}

/** On login: merge the guest cart into the saved server cart, then clear guest storage. */
export function mergeGuestCartOnLogin(): AppThunk<Promise<void>> {
  return async (dispatch) => {
    const guest = loadGuestCart()
    try {
      const merged = await mergeCart(guest)
      dispatch(setCart(merged))
      clearGuestCart()
    } catch {
      // Keep the guest cart for a later retry.
    }
  }
}

/** On authed reload: load the saved server cart. */
export function loadServerCart(): AppThunk<Promise<void>> {
  return async (dispatch) => {
    try {
      dispatch(setCart(await getCart()))
    } catch {
      // Leave the cart as-is on failure.
    }
  }
}

/** On logout: clear the cart and guest storage. */
export function teardownCart(): AppThunk {
  return (dispatch) => {
    dispatch(clearCart())
    clearGuestCart()
  }
}
