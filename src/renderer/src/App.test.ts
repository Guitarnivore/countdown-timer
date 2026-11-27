import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { useTimer, type UseTimerReturn } from './timer/useTimer'

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

  it('marks paused digits for flashing, including during the last ten seconds', () => {
    expect(renderStatus('paused')).toContain('display-container is-paused')
    expect(renderStatus('paused', true)).toContain('display-container is-paused is-urgent')
    expect(renderStatus('running')).not.toContain('is-paused')
    expect(renderStatus('finished', true)).not.toContain('is-paused')
  })
})
