import { BrowserWindow, screen, shell, type TitleBarOverlay } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { isBoundsVisibleOnDisplays, type SettingsStore } from './settings'
import type { Rectangle } from '../shared/types'
import {
  fitBoundsToKeypad,
  KEYPAD_ASPECT_RATIO,
  KEYPAD_MIN_HEIGHT,
  KEYPAD_MIN_WIDTH
} from './window-layout'

const DEFAULT_WIDTH = 360
const DEFAULT_HEIGHT = 450
const MIN_WIDTH = 120
const MIN_HEIGHT = 72

export function computeInitialBounds(savedBounds: Rectangle | undefined): Rectangle {
  const allDisplays = screen.getAllDisplays().map((d) => d.bounds)
  if (savedBounds && isBoundsVisibleOnDisplays(savedBounds, allDisplays)) {
    return savedBounds
  }

  // Fallback: center on primary display
  const primary = screen.getPrimaryDisplay().workArea
  const width = DEFAULT_WIDTH
  const height = DEFAULT_HEIGHT
  const x = Math.round(primary.x + (primary.width - width) / 2)
  const y = Math.round(primary.y + (primary.height - height) / 2)

  return { x, y, width, height }
}

export function setWindowAlwaysOnTop(win: BrowserWindow, alwaysOnTop: boolean): void {
  if (alwaysOnTop) {
    // 'screen-saver' keeps the timer above normal and most fullscreen windows per ARCHITECTURE.md
    win.setAlwaysOnTop(true, 'screen-saver')
  } else {
    win.setAlwaysOnTop(false)
  }
}

export function setKeypadWindowMode(win: BrowserWindow, enabled: boolean): void {
  if (win.isDestroyed()) return

  if (enabled) {
    const keypadBounds = fitBoundsToKeypad(win.getBounds())
    const workArea = screen.getDisplayMatching(keypadBounds).workArea
    keypadBounds.x = Math.max(
      workArea.x,
      Math.min(keypadBounds.x, workArea.x + workArea.width - keypadBounds.width)
    )
    keypadBounds.y = Math.max(
      workArea.y,
      Math.min(keypadBounds.y, workArea.y + workArea.height - keypadBounds.height)
    )

    win.setMinimumSize(KEYPAD_MIN_WIDTH, KEYPAD_MIN_HEIGHT)
    win.setBounds(keypadBounds)
    win.setAspectRatio(KEYPAD_ASPECT_RATIO)
    return
  }

  win.setAspectRatio(0)
  win.setMinimumSize(MIN_WIDTH, MIN_HEIGHT)
}

export function createTimerWindow(settingsStore: SettingsStore): BrowserWindow {
  const settings = settingsStore.getSettings()
  const initialBounds = computeInitialBounds(settings.bounds)

  const titleBarOverlay: TitleBarOverlay | false =
    process.platform === 'win32'
      ? {
          color: '#00000000',
          symbolColor: '#5B6878',
          height: 28
        }
      : false

  const win = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  // Apply alwaysOnTop and initial opacity
  setWindowAlwaysOnTop(win, settings.alwaysOnTop)
  if (settings.opacity >= 0.3 && settings.opacity <= 1) {
    win.setOpacity(settings.opacity)
  }

  // Debounced bounds persistence
  let boundsTimer: NodeJS.Timeout | null = null
  const persistBounds = (): void => {
    if (boundsTimer) clearTimeout(boundsTimer)
    boundsTimer = setTimeout(() => {
      if (!win.isDestroyed() && !win.isMinimized() && !win.isFullScreen()) {
        const currentBounds = win.getBounds()
        settingsStore.updateSettings({ bounds: currentBounds })
      }
    }, 300)
  }

  win.on('resize', persistBounds)
  win.on('move', persistBounds)

  win.on('close', () => {
    if (boundsTimer) clearTimeout(boundsTimer)
    if (!win.isDestroyed() && !win.isMinimized() && !win.isFullScreen()) {
      settingsStore.updateSettings({ bounds: win.getBounds() })
    }
    settingsStore.flush()
  })

  win.once('ready-to-show', () => {
    setKeypadWindowMode(win, true)
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
