import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface UiState {
  cartDrawerOpen: boolean
}

const initialState: UiState = {
  cartDrawerOpen: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartDrawerOpen(state, action: PayloadAction<boolean>) {
      state.cartDrawerOpen = action.payload
    },
  },
})

export const { setCartDrawerOpen } = uiSlice.actions
export default uiSlice.reducer
