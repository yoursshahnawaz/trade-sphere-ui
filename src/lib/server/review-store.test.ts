import { describe, it, expect } from 'vitest'
import { summarize } from './review-store'

describe('summarize', () => {
  it('returns zeroes for no ratings', () => {
    expect(summarize([])).toEqual({ average: 0, count: 0 })
  })

  it('averages ratings and counts them', () => {
    expect(summarize([5, 4, 3])).toEqual({ average: 4, count: 3 })
  })

  it('keeps a fractional average', () => {
    const { average, count } = summarize([5, 4])
    expect(count).toBe(2)
    expect(average).toBeCloseTo(4.5)
  })
})
