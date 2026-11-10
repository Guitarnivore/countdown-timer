import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { SettingsStore } from './settings'
import { createTimerWindow } from './window'
import { registerIpcHandlers } from './ipc'

const settingsStore = new SettingsStore()
let mainWindow: BrowserWindow | null = null

function initApp(): void {
  // Set app user model id for Windows notifications/taskbar
  electronApp.setAppUserModelId('com.countdowntimer.app')

  // F12 in development, ignore reload shortcuts in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createTimerWindow(settingsStore)
  registerIpcHandlers(mainWindow, settingsStore)

  // Per ARCHITECTURE.md: quit immediately when timer window closes on both platforms
  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}

app.whenReady().then(() => {
  initApp()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createTimerWindow(settingsStore)
      registerIpcHandlers(mainWindow, settingsStore)
    }
  })
})

app.on('window-all-closed', () => {
  // Quit on all platforms including macOS
  app.quit()
})

app.on('before-quit', () => {
  settingsStore.flush()
})
