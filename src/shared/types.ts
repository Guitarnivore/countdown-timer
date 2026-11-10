export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  schemaVersion: 1
  theme: Theme
  alwaysOnTop: boolean
  floatAboveFullscreen: boolean
  soundEnabled: boolean
  volume: number
  opacity: number
  lastDurationMs: number
  bounds?: Rectangle
}

export interface TimerAPI {
  getSettings: () => Promise<Settings>
  setSettings: (partial: Partial<Settings>) => Promise<Settings>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<boolean>
  setOpacity: (opacity: number) => Promise<number>
  setKeypadMode: (enabled: boolean) => Promise<void>
}

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 1,
  theme: 'system',
  alwaysOnTop: true,
  floatAboveFullscreen: false,
  soundEnabled: true,
  volume: 0.8,
  opacity: 1,
  lastDurationMs: 5 * 60 * 1000,
  bounds: undefined
}
