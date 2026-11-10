import { describe, expect, it } from 'vitest'
import { fitBoundsToKeypad, KEYPAD_MIN_HEIGHT, KEYPAD_MIN_WIDTH } from './window-layout'

describe('fitBoundsToKeypad', () => {
  it('expands a small landscape window to the keypad minimum', () => {
    const bounds = fitBoundsToKeypad({ x: 10, y: 20, width: 360, height: 220 })

    expect(bounds).toEqual({ x: 10, y: 20, width: KEYPAD_MIN_WIDTH, height: KEYPAD_MIN_HEIGHT })
  })

  it('keeps larger bounds within the 4:5 ratio without enlarging them', () => {
    const bounds = fitBoundsToKeypad({ x: 10, y: 20, width: 799, height: 699 })

    expect(bounds.width / bounds.height).toBe(4 / 5)
    expect(bounds.width).toBeLessThanOrEqual(799)
    expect(bounds.height).toBeLessThanOrEqual(699)
  })
})
