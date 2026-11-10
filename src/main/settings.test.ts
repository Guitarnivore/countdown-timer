import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'node:path'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isBoundsVisibleOnDisplays, sanitizeSettings, SettingsStore } from './settings'
import { DEFAULT_SETTINGS, type Rectangle } from '../shared/types'

// Mock electron app if needed in node test environment
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userdata')
  }
}))

describe('settings module', () => {
  describe('isBoundsVisibleOnDisplays', () => {
    const singleDisplay: Rectangle[] = [{ x: 0, y: 0, width: 1920, height: 1080 }]

    it('returns true when bounds is fully inside display', () => {
      expect(
        isBoundsVisibleOnDisplays({ x: 100, y: 100, width: 360, height: 220 }, singleDisplay)
      ).toBe(true)
    })

    it('returns true when bounds partially intersects display', () => {
      expect(
        isBoundsVisibleOnDisplays({ x: -100, y: -50, width: 360, height: 220 }, singleDisplay)
      ).toBe(true)
    })

    it('returns false when bounds is completely outside all displays', () => {
      expect(
        isBoundsVisibleOnDisplays({ x: 2500, y: 1500, width: 360, height: 220 }, singleDisplay)
      ).toBe(false)
    })

    it('returns false for undefined or invalid size bounds', () => {
      expect(isBoundsVisibleOnDisplays(undefined, singleDisplay)).toBe(false)
      expect(isBoundsVisibleOnDisplays({ x: 0, y: 0, width: 50, height: 50 }, singleDisplay)).toBe(
        false
      )
      expect(isBoundsVisibleOnDisplays({ x: 0, y: 0, width: 150, height: 30 }, singleDisplay)).toBe(
        false
      )
    })

    it('returns true when bounds intersects secondary display', () => {
      const dualDisplays: Rectangle[] = [
        { x: 0, y: 0, width: 1920, height: 1080 },
        { x: 1920, y: 0, width: 1920, height: 1080 }
      ]
      expect(
        isBoundsVisibleOnDisplays({ x: 2000, y: 100, width: 360, height: 220 }, dualDisplays)
      ).toBe(true)
    })
  })

  describe('sanitizeSettings', () => {
    it('returns defaults on null or non-object input', () => {
      expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
      expect(sanitizeSettings('string')).toEqual(DEFAULT_SETTINGS)
    })

    it('preserves valid settings and strips unknown keys', () => {
      const custom = {
        theme: 'dark',
        alwaysOnTop: false,
        soundEnabled: false,
        volume: 0.5,
        opacity: 0.8,
        lastDurationMs: 60000,
        bounds: { x: 50, y: 60, width: 360, height: 220 },
        extraGarbage: 'should-be-removed'
      }
      const sanitized = sanitizeSettings(custom)
      expect(sanitized.theme).toBe('dark')
      expect(sanitized.alwaysOnTop).toBe(false)
      expect(sanitized.soundEnabled).toBe(false)
      expect(sanitized.volume).toBe(0.5)
      expect(sanitized.opacity).toBe(0.8)
      expect(sanitized.lastDurationMs).toBe(60000)
      expect(sanitized.bounds).toEqual({ x: 50, y: 60, width: 360, height: 220 })
      expect((sanitized as unknown as Record<string, unknown>).extraGarbage).toBeUndefined()
    })

    it('clamps or falls back invalid values', () => {
      const sanitized = sanitizeSettings({
        theme: 'invalid-theme',
        volume: 2.5,
        opacity: 0.1,
        lastDurationMs: -50,
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      })
      expect(sanitized.theme).toBe('system')
      expect(sanitized.volume).toBe(1)
      expect(sanitized.opacity).toBe(0.3)
      expect(sanitized.lastDurationMs).toBe(DEFAULT_SETTINGS.lastDurationMs)
      expect(sanitized.bounds).toBeUndefined()
    })
  })

  describe('SettingsStore persistence', () => {
    let tempDir: string
    let testFilePath: string

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'timer-settings-test-'))
      testFilePath = join(tempDir, 'settings.json')
    })

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true })
    })

    it('returns default settings when file does not exist', () => {
      const store = new SettingsStore(testFilePath)
      expect(store.getSettings()).toEqual(DEFAULT_SETTINGS)
    })

    it('falls back to default settings when file contains invalid JSON', () => {
      writeFileSync(testFilePath, '{ broken json ...', 'utf-8')
      const store = new SettingsStore(testFilePath)
      expect(store.getSettings()).toEqual(DEFAULT_SETTINGS)
    })

    it('saves atomically and flushes immediately', () => {
      const store = new SettingsStore(testFilePath)
      store.updateSettings({ theme: 'dark', alwaysOnTop: false })
      store.flush()

      expect(existsSync(testFilePath)).toBe(true)
      const content = JSON.parse(readFileSync(testFilePath, 'utf-8'))
      expect(content.theme).toBe('dark')
      expect(content.alwaysOnTop).toBe(false)
    })
  })
})
