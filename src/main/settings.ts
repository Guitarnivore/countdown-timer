import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DEFAULT_SETTINGS, type Rectangle, type Settings, type Theme } from '../shared/types'

const MIN_WIDTH = 120
const MIN_HEIGHT = 72

export function isBoundsVisibleOnDisplays(
  bounds: Rectangle | undefined,
  displayBoundsList: Rectangle[]
): boolean {
  if (!bounds) return false
  if (
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height)
  ) {
    return false
  }
  if (bounds.width < MIN_WIDTH || bounds.height < MIN_HEIGHT) {
    return false
  }

  // Check if saved bounds intersect any connected display area
  return displayBoundsList.some((display) => {
    const intersectsX = bounds.x < display.x + display.width && bounds.x + bounds.width > display.x
    const intersectsY =
      bounds.y < display.y + display.height && bounds.y + bounds.height > display.y
    return intersectsX && intersectsY
  })
}

export function sanitizeSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS }
  }

  const candidate = raw as Record<string, unknown>
  const theme: Theme =
    candidate.theme === 'light' || candidate.theme === 'dark' || candidate.theme === 'system'
      ? candidate.theme
      : DEFAULT_SETTINGS.theme

  const alwaysOnTop =
    typeof candidate.alwaysOnTop === 'boolean'
      ? candidate.alwaysOnTop
      : DEFAULT_SETTINGS.alwaysOnTop

  const floatAboveFullscreen =
    typeof candidate.floatAboveFullscreen === 'boolean'
      ? candidate.floatAboveFullscreen
      : DEFAULT_SETTINGS.floatAboveFullscreen

  const soundEnabled =
    typeof candidate.soundEnabled === 'boolean'
      ? candidate.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled

  const volume =
    typeof candidate.volume === 'number' && Number.isFinite(candidate.volume)
      ? Math.max(0, Math.min(1, candidate.volume))
      : DEFAULT_SETTINGS.volume

  const opacity =
    typeof candidate.opacity === 'number' && Number.isFinite(candidate.opacity)
      ? Math.max(0.3, Math.min(1, candidate.opacity))
      : DEFAULT_SETTINGS.opacity

  const lastDurationMs =
    typeof candidate.lastDurationMs === 'number' &&
    Number.isFinite(candidate.lastDurationMs) &&
    candidate.lastDurationMs > 0 &&
    candidate.lastDurationMs <= 99 * 3600 * 1000 + 59 * 60 * 1000 + 59 * 1000
      ? Math.floor(candidate.lastDurationMs)
      : DEFAULT_SETTINGS.lastDurationMs

  let bounds: Rectangle | undefined = undefined
  if (candidate.bounds && typeof candidate.bounds === 'object') {
    const b = candidate.bounds as Record<string, unknown>
    if (
      typeof b.x === 'number' &&
      typeof b.y === 'number' &&
      typeof b.width === 'number' &&
      typeof b.height === 'number' &&
      Number.isFinite(b.x) &&
      Number.isFinite(b.y) &&
      Number.isFinite(b.width) &&
      Number.isFinite(b.height) &&
      b.width >= MIN_WIDTH &&
      b.height >= MIN_HEIGHT
    ) {
      bounds = {
        x: Math.round(b.x),
        y: Math.round(b.y),
        width: Math.round(b.width),
        height: Math.round(b.height)
      }
    }
  }

  return {
    schemaVersion: 1,
    theme,
    alwaysOnTop,
    floatAboveFullscreen,
    soundEnabled,
    volume,
    opacity,
    lastDurationMs,
    bounds
  }
}

export class SettingsStore {
  private filePath: string
  private currentSettings: Settings
  private saveTimeout: NodeJS.Timeout | null = null

  constructor(customPath?: string) {
    this.filePath = customPath ?? join(app.getPath('userData'), 'settings.json')
    this.currentSettings = this.loadFromDisk()
  }

  private loadFromDisk(): Settings {
    try {
      if (!existsSync(this.filePath)) {
        return { ...DEFAULT_SETTINGS }
      }
      const rawText = readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(rawText)
      return sanitizeSettings(parsed)
    } catch {
      // Defensive fallback per ARCHITECTURE.md on corrupt file or read failure
      return { ...DEFAULT_SETTINGS }
    }
  }

  getSettings(): Settings {
    return { ...this.currentSettings }
  }

  updateSettings(partial: Partial<Settings>): Settings {
    this.currentSettings = sanitizeSettings({
      ...this.currentSettings,
      ...partial,
      schemaVersion: 1
    })
    this.scheduleDebouncedSave()
    return { ...this.currentSettings }
  }

  private scheduleDebouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.flush()
    }, 300)
  }

  flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }

    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      const tempPath = `${this.filePath}.tmp`
      const payload = JSON.stringify(this.currentSettings, null, 2)
      // Atomic write pattern: write to temporary sibling, then replace
      writeFileSync(tempPath, payload, 'utf-8')
      renameSync(tempPath, this.filePath)
    } catch (err) {
      console.error('Failed to write settings atomically:', err)
    }
  }
}
