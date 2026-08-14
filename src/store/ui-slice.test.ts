import { describe, it, expect } from 'vitest'
import reducer, { setCartDrawerOpen } from './ui-slice'

describe('uiSlice', () => {
  it('defaults cartDrawerOpen to false', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.cartDrawerOpen).toBe(false)
  })

  it('sets cartDrawerOpen to true', () => {
    const state = reducer(undefined, setCartDrawerOpen(true))
    expect(state.cartDrawerOpen).toBe(true)
  })
})
