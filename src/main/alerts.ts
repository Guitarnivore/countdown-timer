import { app, Notification, type BrowserWindow } from 'electron'

export type AttentionAction = 'dock-bounce' | 'flash-frame' | 'none'

/**
 * macOS bounces the Dock icon until the app is activated. Windows flashes the
 * taskbar button, but only when the window is not already focused.
 */
export function attentionAction(platform: NodeJS.Platform, isFocused: boolean): AttentionAction {
  if (platform === 'darwin') return 'dock-bounce'
  if (platform === 'win32' && !isFocused) return 'flash-frame'
  return 'none'
}

export function notifyTimerFinished(win: BrowserWindow): void {
  // The chime is played by the renderer, so the OS notification stays silent.
  if (Notification.isSupported()) {
    new Notification({
      title: 'Countdown Timer',
      body: "Time's up",
      silent: true
    }).show()
  }

  if (win.isDestroyed()) return

  const action = attentionAction(process.platform, win.isFocused())
  if (action === 'dock-bounce') {
    app.dock?.bounce('critical')
  } else if (action === 'flash-frame') {
    win.flashFrame(true)
    win.once('focus', () => {
      if (!win.isDestroyed()) win.flashFrame(false)
    })
  }
}
