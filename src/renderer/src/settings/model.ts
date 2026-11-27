import type { Theme } from '../../../shared/types'

/**
 * Value for the `data-theme` attribute on <html>. `null` removes the attribute,
 * so tokens.css falls back to the prefers-color-scheme block for 'system'.
 */
export function themeAttribute(theme: Theme): 'light' | 'dark' | null {
  return theme === 'system' ? null : theme
}

export function sliderPercentToUnit(percent: number): number {
  if (!Number.isFinite(percent)) return 0
  return Math.max(0, Math.min(100, percent)) / 100
}

export function unitToSliderPercent(unit: number): number {
  if (!Number.isFinite(unit)) return 0
  return Math.round(Math.max(0, Math.min(1, unit)) * 100)
}
