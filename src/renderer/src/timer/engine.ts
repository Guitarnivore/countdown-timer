// Date.now() (wall clock) is used rather than performance.now() so the timer
// keeps counting through system sleep and wake cycles, matching kitchen timer behaviour.

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerState {
  status: TimerStatus
  durationMs: number
  remainingMs: number
  endAtMs: number | null
}

export const MAX_DURATION_MS = (99 * 3600 + 59 * 60 + 59) * 1000

export function isValidDuration(durationMs: number): boolean {
  return (
    typeof durationMs === 'number' &&
    Number.isInteger(durationMs) &&
    durationMs > 0 &&
    durationMs <= MAX_DURATION_MS
  )
}

export function validateDuration(durationMs: number): void {
  if (typeof durationMs !== 'number' || Number.isNaN(durationMs)) {
    throw new TypeError('Duration must be a valid number')
  }
  if (!Number.isInteger(durationMs)) {
    throw new TypeError('Duration must be an integer millisecond value')
  }
  if (durationMs <= 0) {
    throw new RangeError('Duration must be greater than zero')
  }
  if (durationMs > MAX_DURATION_MS) {
    throw new RangeError('Duration exceeds maximum duration of 99:59:59')
  }
}

export function createTimer(durationMs: number): TimerState {
  validateDuration(durationMs)
  return {
    status: 'idle',
    durationMs,
    remainingMs: durationMs,
    endAtMs: null
  }
}

export function start(state: TimerState, nowMs: number): TimerState {
  if (state.status === 'running') {
    return state
  }

  const remainingMs = state.remainingMs > 0 ? state.remainingMs : state.durationMs
  return {
    ...state,
    status: 'running',
    remainingMs,
    endAtMs: nowMs + remainingMs
  }
}

export function pause(state: TimerState, nowMs: number): TimerState {
  if (state.status !== 'running') {
    return state
  }

  const endAt = state.endAtMs ?? nowMs
  const remainingMs = Math.max(0, endAt - nowMs)

  return {
    ...state,
    status: remainingMs === 0 ? 'finished' : 'paused',
    remainingMs,
    endAtMs: null
  }
}

export function resume(state: TimerState, nowMs: number): TimerState {
  if (state.status !== 'paused') {
    return state
  }

  if (state.remainingMs <= 0) {
    return {
      ...state,
      status: 'finished',
      remainingMs: 0,
      endAtMs: null
    }
  }

  return {
    ...state,
    status: 'running',
    endAtMs: nowMs + state.remainingMs
  }
}

export function reset(state: TimerState): TimerState {
  return {
    status: 'idle',
    durationMs: state.durationMs,
    remainingMs: state.durationMs,
    endAtMs: null
  }
}

export function getRemainingMs(state: TimerState, nowMs: number): number {
  if (state.status === 'running') {
    if (state.endAtMs === null) {
      return state.remainingMs
    }
    return Math.max(0, state.endAtMs - nowMs)
  }
  return Math.max(0, state.remainingMs)
}

export function isFinished(state: TimerState, nowMs: number): boolean {
  // Only a running timer can transition to finished; prevents repeated triggers after completion.
  if (state.status !== 'running') {
    return false
  }
  return getRemainingMs(state, nowMs) === 0
}

export function finish(state: TimerState): TimerState {
  return {
    ...state,
    status: 'finished',
    remainingMs: 0,
    endAtMs: null
  }
}

export function tick(state: TimerState, nowMs: number, onFinish?: () => void): TimerState {
  if (state.status === 'running' && isFinished(state, nowMs)) {
    onFinish?.()
    return finish(state)
  }
  return state
}

export function setDuration(state: TimerState, durationMs: number): TimerState {
  validateDuration(durationMs)
  return {
    ...state,
    status: 'idle',
    durationMs,
    remainingMs: durationMs,
    endAtMs: null
  }
}
