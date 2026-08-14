import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CartLine } from '@/types'
import type { RootState } from '@/store'
import { clampQuantity } from './cart-merge'

export interface CartState {
  items: CartLine[]
}

const initialState: CartState = { items: [] }

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartLine>) {
      const line = action.payload
      const existing = state.items.find((i) => i.productId === line.productId)
      if (existing) {
        const q = clampQuantity(existing.quantity + line.quantity, existing.stock)
        if (q <= 0) state.items = state.items.filter((i) => i.productId !== line.productId)
        else existing.quantity = q
        return
      }
      const quantity = clampQuantity(line.quantity, line.stock)
      if (quantity > 0) state.items.push({ ...line, quantity })
    },
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId)
      if (!item) return
      const quantity = clampQuantity(action.payload.quantity, item.stock)
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.productId !== action.payload.productId)
      } else {
        item.quantity = quantity
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload)
    },
    setCart(state, action: PayloadAction<CartLine[]>) {
      state.items = action.payload
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addItem, setQuantity, removeItem, setCart, clearCart } = cartSlice.actions
export default cartSlice.reducer

export const selectCartItems = (s: RootState): CartLine[] => s.cart.items
export const selectCartCount = (s: RootState): number =>
  s.cart.items.reduce((n, i) => n + i.quantity, 0)
export const selectSubtotalCents = (s: RootState): number =>
  s.cart.items.reduce((n, i) => n + i.priceCents * i.quantity, 0)
