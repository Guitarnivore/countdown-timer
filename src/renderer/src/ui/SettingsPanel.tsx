import type { JSX } from 'react'
import type { Settings, Theme } from '../../../shared/types'
import { sliderPercentToUnit, unitToSliderPercent } from '../settings/model'

export interface SettingsPanelProps {
  settings: Settings
  onChange: (partial: Partial<Settings>) => void
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

export function SettingsPanel({ settings, onChange }: SettingsPanelProps): JSX.Element {
  return (
    <div className="settings-panel" role="group" aria-label="Settings">
      <fieldset className="settings-row settings-theme">
        <legend className="settings-label">Theme</legend>
        <div className="segmented-control">
          {THEME_OPTIONS.map((option) => (
            <label key={option.value} className="segmented-option no-drag">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={settings.theme === option.value}
                onChange={() => onChange({ theme: option.value })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="settings-row">
        <label className="settings-label no-drag" htmlFor="settings-sound">
          Play sound
        </label>
        <input
          id="settings-sound"
          className="no-drag"
          type="checkbox"
          checked={settings.soundEnabled}
          onChange={(event) => onChange({ soundEnabled: event.target.checked })}
        />
      </div>

      <div className="settings-row">
        <label className="settings-label no-drag" htmlFor="settings-volume">
          Volume
        </label>
        <input
          id="settings-volume"
          className="no-drag"
          type="range"
          min={0}
          max={100}
          step={5}
          value={unitToSliderPercent(settings.volume)}
          disabled={!settings.soundEnabled}
          aria-valuetext={`${unitToSliderPercent(settings.volume)}%`}
          onChange={(event) =>
            onChange({ volume: sliderPercentToUnit(Number(event.target.value)) })
          }
        />
      </div>

      <div className="settings-row">
        <label className="settings-label no-drag" htmlFor="settings-keep-on-top">
          Keep on top
        </label>
        <input
          id="settings-keep-on-top"
          className="no-drag"
          type="checkbox"
          checked={settings.alwaysOnTop}
          onChange={(event) => onChange({ alwaysOnTop: event.target.checked })}
        />
      </div>

      <div className="settings-row">
        <label className="settings-label no-drag" htmlFor="settings-opacity">
          Opacity
        </label>
        <input
          id="settings-opacity"
          className="no-drag"
          type="range"
          min={30}
          max={100}
          step={5}
          value={unitToSliderPercent(settings.opacity)}
          aria-valuetext={`${unitToSliderPercent(settings.opacity)}%`}
          onChange={(event) =>
            onChange({ opacity: sliderPercentToUnit(Number(event.target.value)) })
          }
        />
      </div>
    </div>
  )
}
