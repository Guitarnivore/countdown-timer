import type { JSX } from 'react'
import type { TimerStatus } from '../timer/engine'

export interface ControlsProps {
  status: TimerStatus
  canStart: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onRestart: () => void
  className?: string
}

export function Controls({
  status,
  canStart,
  onStart,
  onPause,
  onResume,
  onReset,
  onRestart,
  className = ''
}: ControlsProps): JSX.Element {
  const renderPrimaryButton = (): JSX.Element => {
    switch (status) {
      case 'idle':
        return (
          <button
            type="button"
            className="control-button primary-button no-drag"
            onClick={onStart}
            disabled={!canStart}
            aria-label="Start timer"
          >
            Start
          </button>
        )
      case 'running':
        return (
          <button
            type="button"
            className="control-button primary-button no-drag"
            onClick={onPause}
            aria-label="Pause timer"
          >
            Pause
          </button>
        )
      case 'paused':
        return (
          <button
            type="button"
            className="control-button primary-button no-drag"
            onClick={onResume}
            aria-label="Resume timer"
          >
            Resume
          </button>
        )
      case 'finished':
        return (
          <button
            type="button"
            className="control-button primary-button no-drag"
            onClick={onRestart}
            aria-label="Restart timer"
          >
            Restart
          </button>
        )
    }
  }

  return (
    <div className={`controls-row ${className}`.trim()} role="group" aria-label="Timer controls">
      <button
        type="button"
        className="control-button secondary-button no-drag"
        onClick={onReset}
        aria-label="Reset timer"
      >
        Reset
      </button>
      {renderPrimaryButton()}
    </div>
  )
}
