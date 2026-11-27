import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { useTimer, type UseTimerReturn } from './timer/useTimer'
import { Display } from './ui/Display'
import { SettingsPanel } from './ui/SettingsPanel'
import { DEFAULT_SETTINGS } from '../../shared/types'

vi.mock('./timer/useTimer', () => ({ useTimer: vi.fn() }))

function renderStatus(status: UseTimerReturn['status'], isUrgent = false): string {
  vi.mocked(useTimer).mockReturnValue({
    status,
    durationMs: 60_000,
    remainingMs: 30_000,
    formattedTime: '00:30',
    hours: 0,
    minutes: 0,
    seconds: 30,
    progress: 0.5,
    isFinished: status === 'finished',
    isUrgent,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
    restart: vi.fn(),
    setDuration: vi.fn()
  })

  return renderToStaticMarkup(createElement(App))
}

describe('timer setup and active layouts', () => {
  it('shows the keypad only when idle', () => {
    for (const status of ['idle', 'running', 'paused', 'finished'] as const) {
      const markup = renderStatus(status)
      expect(markup.includes('aria-label="Duration keypad"')).toBe(status === 'idle')
      expect(markup.includes('stage keypad-visible')).toBe(status === 'idle')
    }
  })

  it('starts with labelled zeroes and Go disabled', () => {
    const markup = renderStatus('idle')
    expect(markup).toContain('Timer set to 00:00:00')
    expect(markup).toContain('disabled="" aria-label="Go timer"')
    expect(markup).toContain('>hours</span>')
    expect(markup).toContain('>minutes</span>')
    expect(markup).toContain('>seconds</span>')
    expect(markup).not.toContain('is-entered')
  })

  it('marks only entered digits and preserves all three setup fields', () => {
    const markup = renderToStaticMarkup(
      createElement(Display, {
        formattedTime: '00:00',
        status: 'idle',
        isUrgent: false,
        isFinished: false,
        isEditing: true,
        editDigits: '500'
      })
    )
    expect(markup).toContain('Timer set to 00:05:00')
    expect(markup.match(/class="is-entered"/g)).toHaveLength(3)
  })

  it('marks paused digits for flashing, including during the last ten seconds', () => {
    expect(renderStatus('paused')).toContain('display-container is-paused')
    expect(renderStatus('paused', true)).toContain('display-container is-paused is-urgent')
    expect(renderStatus('running')).not.toContain('is-paused')
    expect(renderStatus('finished', true)).not.toContain('is-paused')
  })

  it('keeps second-by-second timer updates out of live announcements', () => {
    const markup = renderStatus('running')
    expect(markup).toContain('role="timer"')
    expect(markup).toContain('aria-live="off"')
    expect(markup.match(/aria-live="polite"/g)).toHaveLength(1)
  })

  it('shows the full-screen floating option only in the Mac settings panel', () => {
    const windowsMarkup = renderToStaticMarkup(
      createElement(SettingsPanel, { settings: DEFAULT_SETTINGS, onChange: vi.fn() })
    )
    const macMarkup = renderToStaticMarkup(
      createElement(SettingsPanel, {
        settings: DEFAULT_SETTINGS,
        onChange: vi.fn(),
        showMacSettings: true
      })
    )
    expect(windowsMarkup).not.toContain('Float above full-screen apps (Mac)')
    expect(macMarkup).toContain('Float above full-screen apps (Mac)')
  })
})
