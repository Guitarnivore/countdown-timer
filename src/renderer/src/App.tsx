import { useEffect, useState, type JSX } from 'react'
import type { Settings } from '../../shared/types'

export default function App(): JSX.Element {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isPinned, setIsPinned] = useState<boolean>(true)
  const [statusMessage, setStatusMessage] = useState<string>(() =>
    typeof window !== 'undefined' && window.api
      ? 'Connecting to IPC...'
      : 'window.api bridge unavailable'
  )

  useEffect(() => {
    let mounted = true
    if (!window.api?.getSettings) return

    window.api
      .getSettings()
      .then((loaded) => {
        if (!mounted) return
        setSettings(loaded)
        setIsPinned(loaded.alwaysOnTop)
        setStatusMessage('IPC bridge connected')
      })
      .catch((err) => {
        if (!mounted) return
        setStatusMessage(`Failed to load settings: ${String(err)}`)
      })

    return (): void => {
      mounted = false
    }
  }, [])

  const handleTogglePin = async (): Promise<void> => {
    const nextState = !isPinned
    try {
      if (window.api && typeof window.api.setAlwaysOnTop === 'function') {
        const result = await window.api.setAlwaysOnTop(nextState)
        setIsPinned(result)
        setSettings((prev) => (prev ? { ...prev, alwaysOnTop: result } : prev))
        setStatusMessage(`Always on top ${result ? 'enabled' : 'disabled'}`)
      }
    } catch (err) {
      setStatusMessage(`Error setting pin: ${String(err)}`)
    }
  }

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
  const isWin = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg)',
        color: 'var(--ink)'
      }}
    >
      {/* Title bar drag region; safe margins avoid Windows caption buttons and macOS traffic lights */}
      <header className="title-bar">
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ink-muted)',
            marginLeft: isMac ? '72px' : '0'
          }}
        >
          Countdown Timer Shell
        </span>
        <button
          type="button"
          onClick={handleTogglePin}
          className="no-drag"
          style={{
            minHeight: '28px',
            padding: '2px var(--space-2)',
            borderRadius: 'var(--radius-control)',
            backgroundColor: isPinned ? 'var(--accent)' : 'var(--surface)',
            color: isPinned ? 'var(--surface)' : 'var(--ink)',
            fontSize: '12px',
            fontWeight: 600,
            marginRight: isWin ? '140px' : '0'
          }}
          aria-pressed={isPinned}
        >
          {isPinned ? 'Pinned' : 'Pin'}
        </button>
      </header>

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: 'var(--space-3)',
          textAlign: 'center',
          gap: 'var(--space-2)'
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Phase 2: Window shell</p>
        <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{statusMessage}</p>
        {settings && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--ink-muted)',
              backgroundColor: 'var(--surface)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--line)',
              maxWidth: '90%'
            }}
          >
            Always on top: {settings.alwaysOnTop ? 'true' : 'false'} | Opacity: {settings.opacity} |
            Theme: {settings.theme}
          </div>
        )}
      </main>
    </div>
  )
}
