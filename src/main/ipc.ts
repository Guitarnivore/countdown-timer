import { ipcMain, type BrowserWindow } from 'electron'
import type { SettingsStore } from './settings'
import { setWindowAlwaysOnTop } from './window'
import type { Settings } from '../shared/types'

export function registerIpcHandlers(win: BrowserWindow, settingsStore: SettingsStore): void {
  // Clear any existing handlers to allow safe re-registration if window reloads
  ipcMain.removeHandler('settings:get')
  ipcMain.removeHandler('settings:set')
  ipcMain.removeHandler('window:setAlwaysOnTop')
  ipcMain.removeHandler('window:setOpacity')

  ipcMain.handle('settings:get', (): Settings => {
    return settingsStore.getSettings()
  })

  ipcMain.handle('settings:set', (_event, partial: unknown): Settings => {
    if (!partial || typeof partial !== 'object') {
      return settingsStore.getSettings()
    }

    const updated = settingsStore.updateSettings(partial as Partial<Settings>)
    const candidate = partial as Record<string, unknown>

    if (typeof candidate.alwaysOnTop === 'boolean' && !win.isDestroyed()) {
      setWindowAlwaysOnTop(win, candidate.alwaysOnTop)
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

    if (!win.isDestroyed()) {
      setWindowAlwaysOnTop(win, alwaysOnTop)
    }
    settingsStore.updateSettings({ alwaysOnTop })
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
}
