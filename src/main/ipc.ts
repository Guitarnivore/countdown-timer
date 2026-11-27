import { ipcMain, type BrowserWindow } from 'electron'
import type { SettingsStore } from './settings'
import { setKeypadWindowMode, setWindowPresentation } from './window'
import { notifyTimerFinished } from './alerts'
import type { Settings } from '../shared/types'

export function registerIpcHandlers(win: BrowserWindow, settingsStore: SettingsStore): void {
  // Clear any existing handlers to allow safe re-registration if window reloads
  ipcMain.removeHandler('settings:get')
  ipcMain.removeHandler('settings:set')
  ipcMain.removeHandler('window:setAlwaysOnTop')
  ipcMain.removeHandler('window:setOpacity')
  ipcMain.removeHandler('window:setKeypadMode')
  ipcMain.removeHandler('alert:finished')
  ipcMain.removeAllListeners('progress:set')

  ipcMain.handle('settings:get', (): Settings => {
    return settingsStore.getSettings()
  })

  ipcMain.handle('alert:finished', (): void => {
    if (!win.isDestroyed()) {
      notifyTimerFinished(win)
    }
  })

  ipcMain.handle('settings:set', (_event, partial: unknown): Settings => {
    if (!partial || typeof partial !== 'object') {
      return settingsStore.getSettings()
    }

    const updated = settingsStore.updateSettings(partial as Partial<Settings>)
    const candidate = partial as Record<string, unknown>

    if (
      (typeof candidate.alwaysOnTop === 'boolean' ||
        typeof candidate.floatAboveFullscreen === 'boolean') &&
      !win.isDestroyed()
    ) {
      setWindowPresentation(win, updated.alwaysOnTop, updated.floatAboveFullscreen)
    }

    if (
      typeof candidate.opacity === 'number' &&
      Number.isFinite(candidate.opacity) &&
      !win.isDestroyed()
    ) {
      win.setOpacity(updated.opacity)
    }

    return updated
  })

  ipcMain.handle('window:setAlwaysOnTop', (_event, alwaysOnTop: unknown): boolean => {
    if (typeof alwaysOnTop !== 'boolean') {
      throw new TypeError('Expected boolean for alwaysOnTop')
    }

    const updated = settingsStore.updateSettings({ alwaysOnTop })
    if (!win.isDestroyed()) {
      setWindowPresentation(win, updated.alwaysOnTop, updated.floatAboveFullscreen)
    }
    return alwaysOnTop
  })

  ipcMain.handle('window:setOpacity', (_event, opacity: unknown): number => {
    if (typeof opacity !== 'number' || !Number.isFinite(opacity)) {
      throw new TypeError('Expected finite number for opacity')
    }

    const clamped = Math.max(0.3, Math.min(1, opacity))
    if (!win.isDestroyed()) {
      win.setOpacity(clamped)
    }
    settingsStore.updateSettings({ opacity: clamped })
    return clamped
  })

  ipcMain.handle('window:setKeypadMode', (_event, enabled: unknown): void => {
    if (typeof enabled !== 'boolean') {
      throw new TypeError('Expected boolean for keypad mode')
    }

    setKeypadWindowMode(win, enabled)
  })

  ipcMain.on('progress:set', (_event, progress: unknown): void => {
    if (
      typeof progress !== 'number' ||
      !Number.isFinite(progress) ||
      (progress !== -1 && (progress < 0 || progress > 1))
    ) {
      console.error('Rejected invalid progress:set payload')
      return
    }

    if (!win.isDestroyed()) {
      win.setProgressBar(progress)
    }
  })
}
