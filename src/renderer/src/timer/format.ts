import { MAX_DURATION_MS } from './engine'

export interface ParsedDigits {
  ms: number
  formatted: string
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59

export function formatRemaining(remainingMs: number): string {
  // Ceil display rounding ensures 00:01 remains visible until complete, and 00:00 appears only at finish.
  const clampedMs = Math.min(Math.max(0, remainingMs), MAX_DURATION_MS)
  const totalSeconds = Math.ceil(clampedMs / 1000)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }

  return `${mm}:${ss}`
}

export function parseDigits(input: string | number[]): ParsedDigits {
  const rawString = Array.isArray(input) ? input.join('') : String(input)
  const digitsOnly = rawString.replace(/\D/g, '')

  // Discard subsequent keystrokes once 6 digits (HHMMSS) are reached.
  const boundedDigits = digitsOnly.slice(0, 6)
  const padded = boundedDigits.padStart(6, '0')

  const hours = Number(padded.slice(0, 2))
  const minutes = Number(padded.slice(2, 4))
  const seconds = Number(padded.slice(4, 6))

  const rawTotalSeconds = hours * 3600 + minutes * 60 + seconds
  const totalSeconds = Math.min(rawTotalSeconds, MAX_SECONDS)
  const ms = totalSeconds * 1000
  const enteredFormatted =
    hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return {
    ms,
    formatted: enteredFormatted,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds
  }
}
