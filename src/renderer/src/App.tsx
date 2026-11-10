import { useCallback, useEffect, useState, type JSX } from 'react'
import { parseDigits } from './timer/format'
import { useTimer } from './timer/useTimer'
import { Controls } from './ui/Controls'
import { Display } from './ui/Display'
import { Presets } from './ui/Presets'
import { ProgressBar, ProgressRing } from './ui/ProgressRing'

export default function App(): JSX.Element {
  const [isPinned, setIsPinned] = useState<boolean>(true)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editBuffer, setEditBuffer] = useState<string>('')

  const timer = useTimer({
    initialDurationMs: 5 * 60 * 1000
  })

  // Load initial settings (alwaysOnTop) from main process
  useEffect(() => {
    if (!window.api?.getSettings) return
    window.api
      .getSettings()
      .then((settings) => {
        setIsPinned(settings.alwaysOnTop)
      })
      .catch(() => {
        // Retain default pinned state
      })
  }, [])

  const handleTogglePin = useCallback(async (): Promise<void> => {
    const nextPin = !isPinned
    setIsPinned(nextPin)
    try {
      if (window.api?.setAlwaysOnTop) {
        const actual = await window.api.setAlwaysOnTop(nextPin)
        setIsPinned(actual)
      }
    } catch {
      // Retain optimistic UI state
    }
  }, [isPinned])

  const commitEdit = useCallback((): boolean => {
    if (!isEditing) return false
    const parsed = parseDigits(editBuffer)
    if (parsed.ms > 0) {
      timer.setDuration(parsed.ms)
    }
    setIsEditing(false)
    setEditBuffer('')
    return parsed.ms > 0
  }, [editBuffer, isEditing, timer])

  const cancelEdit = useCallback((): void => {
    setIsEditing(false)
    setEditBuffer('')
  }, [])

  const handleSelectPreset = useCallback(
    (durationMs: number): void => {
      cancelEdit()
      timer.setDuration(durationMs)
    },
    [cancelEdit, timer]
  )

  const handleStart = useCallback((): void => {
    if (isEditing) {
      const valid = commitEdit()
      if (valid) {
        timer.start()
      }
      return
    }
    timer.start()
  }, [commitEdit, isEditing, timer])

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
        cancelEdit()
        timer.reset()
        return
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault()
        void handleTogglePin()
        return
      }

      if (event.key === 'Escape') {
        if (isEditing) {
          event.preventDefault()
          cancelEdit()
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
        if (/^[0-9]$/.test(event.key)) {
          event.preventDefault()
          setIsEditing(true)
          setEditBuffer((prev) => (prev.length < 6 ? prev + event.key : prev))
        } else if (event.key === 'Backspace' && isEditing) {
          event.preventDefault()
          setEditBuffer((prev) => prev.slice(0, -1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [cancelEdit, handleStart, handleTogglePin, isEditing, timer])

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
  const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent)

  const parsedEdit = parseDigits(editBuffer)
  const canStart = timer.durationMs > 0 || (isEditing && parsedEdit.ms > 0)

  return (
    <div className="app-shell">
      <header className="header-bar">
        <span className="header-title" style={{ marginLeft: isMac ? 'var(--space-6)' : '0' }}>
          Countdown
        </span>
        <button
          type="button"
          onClick={() => void handleTogglePin()}
          className={`pin-button no-drag${isPinned ? ' is-pinned' : ''}`}
          style={{ marginRight: isWin ? '140px' : '0' }}
          aria-pressed={isPinned}
          aria-label={isPinned ? 'Always on top: on' : 'Always on top: off'}
        >
          {isPinned ? 'Pinned' : 'Pin'}
        </button>
      </header>

      <main className="stage">
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
            editFormatted={parsedEdit.formatted}
            onStartEdit={() => {
              if (timer.status === 'idle') {
                setIsEditing(true)
                setEditBuffer('')
              }
            }}
          />
        </div>

        <ProgressBar
          progress={timer.progress}
          isUrgent={timer.isUrgent}
          isFinished={timer.isFinished}
        />

        <Controls
          status={timer.status}
          canStart={canStart}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={() => {
            cancelEdit()
            timer.reset()
          }}
          onRestart={timer.restart}
        />

        <Presets
          onSelectDuration={handleSelectPreset}
          currentDurationMs={timer.durationMs}
          disabled={timer.status === 'running'}
        />

        <Controls
          className="tiny-controls-strip"
          status={timer.status}
          canStart={canStart}
          onStart={handleStart}
          onPause={timer.pause}
          onResume={timer.resume}
          onReset={() => {
            cancelEdit()
            timer.reset()
          }}
          onRestart={timer.restart}
        />
      </main>
    </div>
  )
}
