import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SessionUser } from '@/types'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: SessionUser | null
}

const initialState: AuthState = { status: 'idle', user: null }

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state) {
      state.status = 'loading'
    },
    setUser(state, action: PayloadAction<SessionUser>) {
      state.user = action.payload
      state.status = 'authenticated'
    },
    clearUser(state) {
      state.user = null
      state.status = 'unauthenticated'
    },
  },
})

export const { setLoading, setUser, clearUser } = authSlice.actions
export default authSlice.reducer
