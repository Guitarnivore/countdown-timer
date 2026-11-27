import type { CSSProperties, JSX } from 'react'
import type { TimerStatus } from '../timer/engine'

export interface DisplayProps {
  formattedTime: string
  status: TimerStatus
  isUrgent: boolean
  isFinished: boolean
  isEditing: boolean
  editDigits: string
  onStartEdit?: () => void
}

export function Display({
  formattedTime,
  status,
  isUrgent,
  isFinished,
  isEditing,
  editDigits,
  onStartEdit
}: DisplayProps): JSX.Element {
  const paddedDigits = editDigits.padStart(6, '0')
  const displayString =
    status === 'idle'
      ? `${paddedDigits.slice(0, 2)}:${paddedDigits.slice(2, 4)}:${paddedDigits.slice(4, 6)}`
      : formattedTime
  const charsCount = displayString.length

  const styleVariables = {
    '--chars': charsCount
  } as CSSProperties

  const stateClass = `is-${status}${isUrgent && !isFinished ? ' is-urgent' : ''}`

  return (
    <div
      className={`display-container ${stateClass}${isEditing ? ' is-editing' : ''}`}
      style={styleVariables}
      onClick={status === 'idle' ? onStartEdit : undefined}
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
      {status === 'idle' ? (
        <span className="setup-fields" aria-hidden="true">
          {['hours', 'minutes', 'seconds'].map((label, fieldIndex) => (
            <span className="setup-field" key={label}>
              <span className="setup-field-value">
                {paddedDigits
                  .slice(fieldIndex * 2, fieldIndex * 2 + 2)
                  .split('')
                  .map((digit, digitIndex) => (
                    <span
                      className={
                        fieldIndex * 2 + digitIndex >= 6 - editDigits.length
                          ? 'is-entered'
                          : undefined
                      }
                      key={digitIndex}
                    >
                      {digit}
                    </span>
                  ))}
              </span>
              <span className="setup-field-label">{label}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className="digits" aria-hidden="true">
          {displayString}
        </span>
      )}
      {isFinished && <span className="finished-badge">Time&apos;s up</span>}
    </div>
  )
}
