import { describe, expect, it, vi } from 'vitest'
import { attentionAction } from './alerts'

vi.mock('electron', () => ({
  app: { dock: undefined },
  Notification: class {
    static isSupported(): boolean {
      return false
    }
  }
}))

describe('attentionAction', () => {
  it('bounces the Dock on macOS whether or not the window is focused', () => {
    expect(attentionAction('darwin', true)).toBe('dock-bounce')
    expect(attentionAction('darwin', false)).toBe('dock-bounce')
  })

  it('flashes the taskbar on Windows only when the window is not focused', () => {
    expect(attentionAction('win32', false)).toBe('flash-frame')
    expect(attentionAction('win32', true)).toBe('none')
  })

  it('does nothing on other platforms', () => {
    expect(attentionAction('linux', false)).toBe('none')
  })
})
