import type { CSSProperties, JSX } from 'react'
import type { TimerStatus } from '../timer/engine'

export interface DisplayProps {
  formattedTime: string
  status: TimerStatus
  isUrgent: boolean
  isFinished: boolean
  isEditing: boolean
  editFormatted?: string
  onStartEdit?: () => void
}

export function Display({
  formattedTime,
  status,
  isUrgent,
  isFinished,
  isEditing,
  editFormatted,
  onStartEdit
}: DisplayProps): JSX.Element {
  const displayString = isEditing && editFormatted ? editFormatted : formattedTime
  const charsCount = displayString.length

  const styleVariables = {
    '--chars': charsCount
  } as CSSProperties

  const stateClass = isFinished
    ? 'is-finished'
    : isUrgent
      ? 'is-urgent'
      : status === 'paused'
        ? 'is-paused'
        : status === 'running'
          ? 'is-running'
          : 'is-idle'

  return (
    <div
      className={`display-container ${stateClass}${isEditing ? ' is-editing' : ''}`}
      style={styleVariables}
      onClick={status === 'idle' || status === 'paused' ? onStartEdit : undefined}
      onKeyDown={
        status === 'idle'
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onStartEdit?.()
              }
            }
          : undefined
      }
      role={status === 'idle' ? 'button' : 'timer'}
      tabIndex={status === 'idle' ? 0 : undefined}
      aria-label={
        status === 'idle'
          ? `Timer set to ${displayString}. Click or type to edit.`
          : `Remaining time: ${displayString}`
      }
    >
      <span className="digits" aria-hidden="true">
        {displayString}
      </span>
      {isFinished && <span className="finished-badge">Time&apos;s up</span>}
    </div>
  )
}
