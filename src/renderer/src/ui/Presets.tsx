import type { JSX } from 'react'

export interface PresetsProps {
  onSelectDuration: (durationMs: number) => void
  currentDurationMs: number
  disabled?: boolean
}

interface PresetItem {
  label: string
  ms: number
  ariaLabel: string
}

const PRESETS: PresetItem[] = [
  { label: '1', ms: 1 * 60 * 1000, ariaLabel: '1 minute' },
  { label: '5', ms: 5 * 60 * 1000, ariaLabel: '5 minutes' },
  { label: '10', ms: 10 * 60 * 1000, ariaLabel: '10 minutes' },
  { label: '15', ms: 15 * 60 * 1000, ariaLabel: '15 minutes' },
  { label: '25', ms: 25 * 60 * 1000, ariaLabel: '25 minutes' },
  { label: '60', ms: 60 * 60 * 1000, ariaLabel: '60 minutes' }
]

export function Presets({
  onSelectDuration,
  currentDurationMs,
  disabled = false
}: PresetsProps): JSX.Element {
  return (
    <nav className="presets-row" aria-label="Quick timer presets">
      {PRESETS.map((preset) => {
        const isSelected = currentDurationMs === preset.ms
        return (
          <button
            key={preset.label}
            type="button"
            className={`preset-button no-drag${isSelected ? ' is-active' : ''}`}
            onClick={() => onSelectDuration(preset.ms)}
            disabled={disabled}
            aria-label={preset.ariaLabel}
            aria-pressed={isSelected}
          >
            {preset.label}
          </button>
        )
      })}
    </nav>
  )
}
