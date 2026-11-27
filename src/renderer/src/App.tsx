import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { playFinishChime, primeAlertAudio, stopFinishChime } from './audio/chime'
import { appendKeypadDigits, parseDigits } from './timer/format'
import { useTimer } from './timer/useTimer'
import { Controls } from './ui/Controls'
import { Display } from './ui/Display'
import { Keypad } from './ui/Keypad'
import { ProgressBar, ProgressRing } from './ui/ProgressRing'
import { SettingsPanel } from './ui/SettingsPanel'
import { themeAttribute } from './settings/model'
import { DEFAULT_SETTINGS, type Settings } from '../../shared/types'

export default function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [keypadDigits, setKeypadDigits] = useState<string>('')
  const [announcement, setAnnouncement] = useState<string>('')

  const settingsRef = useRef<Settings | null>(null)
  const announcementStateRef = useRef({ status: 'idle', seconds: 0 })
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const handleFinish = useCallback((): void => {
    const current = settingsRef.current ?? DEFAULT_SETTINGS
    if (current.soundEnabled) {
      playFinishChime(current.volume)
    }
    void window.api?.alertFinished?.().catch((error: unknown) => {
      console.error('Failed to show finish alert:', error)
    })
  }, [])

  const timer = useTimer({ onFinish: handleFinish })

  useEffect(() => {
    const previous = announcementStateRef.current
    const seconds = Math.ceil(Math.max(0, timer.remainingMs) / 1000)
    let message = ''

    if (timer.status === 'finished' && previous.status !== 'finished') {
      message = "Time's up."
    } else if (timer.status === 'running') {
      if (previous.status !== 'running') {
        message = `${previous.status === 'paused' ? 'Timer resumed' : 'Timer started'}. ${timer.formattedTime} remaining.`
      } else if (seconds < previous.seconds) {
        const previousMinute = Math.floor((previous.seconds - 1) / 60)
        const currentMinute = Math.floor((seconds - 1) / 60)
        if (seconds > 0 && previousMinute > currentMinute) {
          const minutes = Math.ceil(seconds / 60)
          message = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} remaining.`
        } else if (previous.seconds > 10 && seconds <= 10) {
          message = '10 seconds remaining.'
        }
      }
    }

    announcementStateRef.current = { status: timer.status, seconds }
    if (message) setAnnouncement(message)
  }, [timer.formattedTime, timer.remainingMs, timer.status])

  useEffect(() => {
    if (!window.api?.setProgress) return
    const isActive = timer.status === 'running' || timer.status === 'paused'
    window.api.setProgress(isActive ? 1 - timer.progress : -1)
  }, [timer.progress, timer.status])

  const isPinned = settings?.alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop
  const theme = settings?.theme ?? DEFAULT_SETTINGS.theme

  // Load persisted settings from the main process
  useEffect(() => {
    if (!window.api?.getSettings) return
    window.api
      .getSettings()
      .then(setSettings)
      .catch((error: unknown) => {
        console.error('Failed to load settings:', error)
      })
  }, [])

  // Theme is a data attribute on <html>; 'system' removes it so tokens.css follows the OS
  useEffect(() => {
    const attribute = themeAttribute(theme)
    if (attribute) {
      document.documentElement.dataset.theme = attribute
    } else {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  // Browsers only allow audio after a user gesture, so unlock it early
  useEffect(() => {
    window.addEventListener('pointerdown', primeAlertAudio)
    window.addEventListener('keydown', primeAlertAudio)
    return (): void => {
      window.removeEventListener('pointerdown', primeAlertAudio)
      window.removeEventListener('keydown', primeAlertAudio)
    }
  }, [])

  useEffect(() => {
    if (timer.status !== 'finished') {
      stopFinishChime()
    }
  }, [timer.status])

  const handleSettingsChange = useCallback((partial: Partial<Settings>): void => {
    setSettings((prev) => ({ ...(prev ?? DEFAULT_SETTINGS), ...partial }))
    if (!window.api?.setSettings) return
    void window.api
      .setSettings(partial)
      .then(setSettings)
      .catch((error: unknown) => {
        console.error('Failed to save settings:', error)
      })
  }, [])

  const handleTogglePin = useCallback((): void => {
    handleSettingsChange({ alwaysOnTop: !isPinned })
  }, [handleSettingsChange, isPinned])

  const handleDigit = useCallback((digit: string): void => {
    setIsEditing(true)
    setKeypadDigits((prev) => appendKeypadDigits(prev, digit))
  }, [])

  const handleBackspace = useCallback((): void => {
    setKeypadDigits((prev) => prev.slice(0, -1))
  }, [])

  const handleStart = useCallback((): void => {
    const parsed = parseDigits(keypadDigits)
    if (parsed.ms === 0) return
    timer.setDuration(parsed.ms)
    setIsEditing(false)
    setIsSettingsOpen(false)
    setKeypadDigits('')
    timer.start()
  }, [keypadDigits, timer])

  const handleReset = useCallback((): void => {
    timer.reset()
    setIsEditing(false)
    setIsSettingsOpen(false)
    setKeypadDigits('')
  }, [timer])

  // Global keyboard shortcuts (Space, R, P, Esc, digits)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Avoid intercepting interactive form elements if present
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }

      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        if (timer.status === 'running') {
          timer.pause()
        } else if (timer.status === 'paused') {
          timer.resume()
        } else if (timer.status === 'finished') {
          timer.restart()
        } else {
          handleStart()
        }
        return
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        handleReset()
        return
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault()
        handleTogglePin()
        return
      }

      if (event.key === 'Escape') {
        if (isSettingsOpen) {
          event.preventDefault()
          setIsSettingsOpen(false)
          return
        }
        if (isEditing) {
          event.preventDefault()
          setIsEditing(false)
          setKeypadDigits('')
        }
        return
      }

      if (event.key === 'Enter') {
        if (isEditing) {
          event.preventDefault()
          handleStart()
        }
        return
      }

      if (timer.status === 'idle') {
        if (event.key === 's' || event.key === 'S') {
          event.preventDefault()
          setIsSettingsOpen((open) => !open)
        } else if (/^[0-9]$/.test(event.key)) {
          event.preventDefault()
          handleDigit(event.key)
        } else if (event.key === 'Backspace' && isEditing) {
          event.preventDefault()
          setKeypadDigits((prev) => prev.slice(0, -1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleReset, handleStart, handleTogglePin, isEditing, isSettingsOpen, timer])

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
  const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent)

  const parsedEdit = parseDigits(keypadDigits)
  const canStart = parsedEdit.ms > 0

  const showKeypad = timer.status === 'idle'

  useEffect(() => {
    void window.api.setKeypadMode(showKeypad).catch((error: unknown) => {
      console.error('Failed to update keypad window mode:', error)
    })
  }, [showKeypad])

  return (
    <div className="app-shell">
      <header className="header-bar">
        <span className="header-title" style={{ marginLeft: isMac ? 'var(--space-6)' : '0' }}>
          Countdown
        </span>
        <div className="header-actions" style={{ marginRight: isWin ? '140px' : '0' }}>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((open) => !open)}
            className="header-button no-drag"
            disabled={timer.status !== 'idle'}
            aria-pressed={isSettingsOpen}
            aria-label="Settings"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={handleTogglePin}
            className={`pin-button no-drag${isPinned ? ' is-pinned' : ''}`}
            aria-pressed={isPinned}
            aria-label={isPinned ? 'Always on top: on' : 'Always on top: off'}
          >
            {isPinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </header>

      <main
        className={`stage${showKeypad ? ' keypad-visible' : ''}${isSettingsOpen ? ' settings-open' : ''}`}
      >
        <div className="ring-stage">
          <ProgressRing
            progress={timer.progress}
            isUrgent={timer.isUrgent}
            isFinished={timer.isFinished}
          />
          <Display
            formattedTime={timer.formattedTime}
            status={timer.status}
            isUrgent={timer.isUrgent}
            isFinished={timer.isFinished}
            isEditing={isEditing}
            editDigits={keypadDigits}
            onStartEdit={() => {
              if (timer.status === 'idle') {
                setIsEditing(true)
              }
            }}
          />
        </div>

        <ProgressBar
          progress={timer.progress}
          isUrgent={timer.isUrgent}
          isFinished={timer.isFinished}
        />

        {showKeypad && isSettingsOpen ? (
          <div className="keypad-panel">
            <SettingsPanel
              settings={settings ?? DEFAULT_SETTINGS}
              onChange={handleSettingsChange}
              showMacSettings={isMac}
            />
          </div>
        ) : null}
        {showKeypad && !isSettingsOpen ? (
          <div className="keypad-panel">
            <Keypad onDigit={handleDigit} onBackspace={handleBackspace} />
          </div>
        ) : null}

        <Controls
          status={timer.status}
          canStart={canStart}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={handleReset}
          onRestart={timer.restart}
        />

        <Controls
          className="tiny-controls-strip"
          status={timer.status}
          canStart={canStart}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={handleReset}
          onRestart={timer.restart}
        />
      </main>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  )
}
