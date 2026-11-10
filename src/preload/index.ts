import { contextBridge, ipcRenderer } from 'electron'
import type { Settings, TimerAPI } from '../shared/types'

const api: TimerAPI = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke('settings:set', partial),
  setAlwaysOnTop: (alwaysOnTop: boolean): Promise<boolean> =>
    ipcRenderer.invoke('window:setAlwaysOnTop', alwaysOnTop),
  setOpacity: (opacity: number): Promise<number> =>
    ipcRenderer.invoke('window:setOpacity', opacity),
  setKeypadMode: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('window:setKeypadMode', enabled)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose api to main world:', error)
  }
} else {
  window.api = api
}
