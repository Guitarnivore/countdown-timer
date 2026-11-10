import type { Rectangle } from '../shared/types'

export const KEYPAD_MIN_WIDTH = 360
export const KEYPAD_MIN_HEIGHT = 450
export const KEYPAD_ASPECT_RATIO = 4 / 5

export function fitBoundsToKeypad(bounds: Rectangle): Rectangle {
  const width = Math.max(
    KEYPAD_MIN_WIDTH,
    Math.floor(Math.min(bounds.width, bounds.height * KEYPAD_ASPECT_RATIO) / 4) * 4
  )

  return {
    ...bounds,
    width,
    height: (width * 5) / 4
  }
}
