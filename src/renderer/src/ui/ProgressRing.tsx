import type { JSX } from 'react'

export interface ProgressRingProps {
  progress: number
  isUrgent: boolean
  isFinished: boolean
}

export function ProgressRing({ progress, isUrgent, isFinished }: ProgressRingProps): JSX.Element {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  // Progress represents remaining fraction (1.0 at start, 0.0 at finish).
  // At finish, fill the ring in urgent colour per DESIGN.md.
  const strokeDashoffset = isFinished ? 0 : circumference * (1 - Math.max(0, Math.min(1, progress)))
  const strokeColor = isUrgent || isFinished ? 'var(--urgent)' : 'var(--accent)'

  return (
    <svg className="progress-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle
        className="progress-ring-track"
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--line)"
        strokeWidth="3.5"
      />
      <circle
        className="progress-ring-indicator"
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export interface ProgressBarProps {
  progress: number
  isUrgent: boolean
  isFinished: boolean
}

export function ProgressBar({ progress, isUrgent, isFinished }: ProgressBarProps): JSX.Element {
  const widthPercent = isFinished ? 100 : Math.max(0, Math.min(100, progress * 100))
  const barColor = isUrgent || isFinished ? 'var(--urgent)' : 'var(--accent)'

  return (
    <div className="progress-bar-track" aria-hidden="true">
      <div
        className="progress-bar-fill"
        style={{
          width: `${widthPercent}%`,
          backgroundColor: barColor
        }}
      />
    </div>
  )
}
