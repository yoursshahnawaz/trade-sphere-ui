import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface UiState {
  cartDrawerOpen: boolean
  firstVisit: boolean
}

const initialState: UiState = {
  cartDrawerOpen: false,
  firstVisit: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartDrawerOpen(state, action: PayloadAction<boolean>) {
      state.cartDrawerOpen = action.payload
    },
    setFirstVisit(state, action: PayloadAction<boolean>) {
      state.firstVisit = action.payload
    },
  },
})

export const { setCartDrawerOpen, setFirstVisit } = uiSlice.actions
export default uiSlice.reducer
