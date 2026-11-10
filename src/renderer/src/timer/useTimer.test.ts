import { describe, expect, it } from 'vitest'
import { computeNextTickDelay } from './useTimer'

describe('useTimer tick delay calculation', () => {
  it('returns 0 when remaining is zero or negative', () => {
    expect(computeNextTickDelay(0)).toBe(0)
    expect(computeNextTickDelay(-100)).toBe(0)
  })

  it('schedules next tick right past the boundary when exactly on a boundary', () => {
    // At 5000ms, displayed is 5s. Target boundary to drop to 4s is 4000ms.
    // Time to boundary is 1000ms. Buffer is 10ms -> 1010ms.
    expect(computeNextTickDelay(5000)).toBe(1010)
  })

  it('schedules next tick past the boundary when mid-second', () => {
    // At 3990ms, displayed is 4s. Target boundary to drop to 3s is 3000ms.
    // Time to boundary is 990ms + 10ms buffer = 1000ms.
    expect(computeNextTickDelay(3990)).toBe(1000)

    // At 3050ms, displayed is 4s. Target boundary is 3000ms.
    // Time to boundary is 50ms + 10ms buffer = 60ms.
    expect(computeNextTickDelay(3050)).toBe(60)
  })

  it('schedules boundary for final second accurately', () => {
    // At 500ms, displayed is 1s. Target boundary is 0ms.
    // Time to boundary is 500ms + 10ms buffer = 510ms.
    expect(computeNextTickDelay(500)).toBe(510)

    // At 5ms, minimum delay clamp is 10ms (5 + 10 = 15ms)
    expect(computeNextTickDelay(5)).toBe(15)
  })
})
