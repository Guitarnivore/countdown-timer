// Date.now() (wall clock) is used rather than performance.now() so the timer
// keeps counting through system sleep and wake cycles, matching kitchen timer behaviour.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type TimerState,
  type TimerStatus,
  createTimer,
  pause as enginePause,
  reset as engineReset,
  resume as engineResume,
  setDuration as engineSetDuration,
  start as engineStart
} from './engine'
import { formatRemaining } from './format'

export interface UseTimerOptions {
  initialDurationMs?: number
  now?: () => number
  onFinish?: () => void
}

export interface UseTimerReturn {
  status: TimerStatus
  durationMs: number
  remainingMs: number
  formattedTime: string
  hours: number
  minutes: number
  seconds: number
  progress: number
  isFinished: boolean
  isUrgent: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  restart: () => void
  setDuration: (durationMs: number) => void
}

/**
 * Computes delay until the next displayed-second boundary plus ~10 ms buffer.
 * Displayed seconds use Math.ceil(remainingMs / 1000). The boundary where
 * the displayed second decreases is at (ceil(remainingMs / 1000) - 1) * 1000.
 */
export function computeNextTickDelay(remainingMs: number): number {
  if (remainingMs <= 0) return 0
  const displayedSeconds = Math.ceil(remainingMs / 1000)
  const targetRem = (displayedSeconds - 1) * 1000
  const timeToBoundary = remainingMs - targetRem
  // Buffer of 10 ms ensures setTimeout wakes up just past the boundary
  return Math.max(10, timeToBoundary + 10)
}

export function useTimer({
  initialDurationMs = 5 * 60 * 1000,
  now = () => Date.now(),
  onFinish
}: UseTimerOptions = {}): UseTimerReturn {
  const [state, setState] = useState<TimerState>(() => createTimer(initialDurationMs))
  const [remainingMs, setRemainingMs] = useState<number>(initialDurationMs)

  const nowRef = useRef(now)
  const onFinishRef = useRef(onFinish)
  const finishDispatchedRef = useRef<boolean>(false)

  useEffect(() => {
    nowRef.current = now
  }, [now])

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const { status, endAtMs } = state

  // Continuous tick loop: schedules recurring setTimeout at each displayed-second boundary
  useEffect(() => {
    if (status !== 'running' || endAtMs === null) {
      return
    }

    let timerId: ReturnType<typeof setTimeout> | null = null
    let isCancelled = false

    const tick = (): void => {
      if (isCancelled) return

      const currentNow = nowRef.current()
      const rem = Math.max(0, endAtMs - currentNow)
      setRemainingMs(rem)

      if (rem === 0) {
        if (!finishDispatchedRef.current) {
          finishDispatchedRef.current = true
          onFinishRef.current?.()
        }
        setState((prev) => ({
          ...prev,
          status: 'finished',
          remainingMs: 0,
          endAtMs: null
        }))
        return
      }

      const delay = computeNextTickDelay(rem)
      timerId = setTimeout(tick, delay)
    }

    // Schedule the first tick from current remaining time
    const currentNow = nowRef.current()
    const rem = Math.max(0, endAtMs - currentNow)
    setRemainingMs(rem)
    const initialDelay = computeNextTickDelay(rem)
    timerId = setTimeout(tick, initialDelay)

    return (): void => {
      isCancelled = true
      if (timerId !== null) {
        clearTimeout(timerId)
      }
    }
  }, [status, endAtMs])

  // Resync on window focus and document visibility change to recover from sleep/background throttle
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResync = (): void => {
      if (status !== 'running' || endAtMs === null) return
      const currentNow = nowRef.current()
      const rem = Math.max(0, endAtMs - currentNow)
      setRemainingMs(rem)

      if (rem === 0) {
        if (!finishDispatchedRef.current) {
          finishDispatchedRef.current = true
          onFinishRef.current?.()
        }
        setState((prev) => ({
          ...prev,
          status: 'finished',
          remainingMs: 0,
          endAtMs: null
        }))
      }
    }

    window.addEventListener('visibilitychange', handleResync)
    window.addEventListener('focus', handleResync)

    return (): void => {
      window.removeEventListener('visibilitychange', handleResync)
      window.removeEventListener('focus', handleResync)
    }
  }, [status, endAtMs])

  const start = useCallback((): void => {
    const currentNow = nowRef.current()
    finishDispatchedRef.current = false
    setState((prev) => {
      const next = engineStart(prev, currentNow)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const pause = useCallback((): void => {
    const currentNow = nowRef.current()
    setState((prev) => {
      const next = enginePause(prev, currentNow)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const resume = useCallback((): void => {
    const currentNow = nowRef.current()
    finishDispatchedRef.current = false
    setState((prev) => {
      const next = engineResume(prev, currentNow)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const reset = useCallback((): void => {
    finishDispatchedRef.current = false
    setState((prev) => {
      const next = engineReset(prev)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const restart = useCallback((): void => {
    const currentNow = nowRef.current()
    finishDispatchedRef.current = false
    setState((prev) => {
      const resetState = engineReset(prev)
      const next = engineStart(resetState, currentNow)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const setDuration = useCallback((durationMs: number): void => {
    finishDispatchedRef.current = false
    setState((prev) => {
      const next = engineSetDuration(prev, durationMs)
      setRemainingMs(next.remainingMs)
      return next
    })
  }, [])

  const effectiveRemaining = status === 'running' ? remainingMs : state.remainingMs
  const formattedTime = formatRemaining(effectiveRemaining)

  const totalSeconds = Math.ceil(Math.max(0, effectiveRemaining) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const progress =
    state.durationMs > 0 ? Math.max(0, Math.min(1, effectiveRemaining / state.durationMs)) : 0
  const isFinishedStatus = status === 'finished'
  const isUrgent = isFinishedStatus || (effectiveRemaining <= 10_000 && status !== 'idle')

  return {
    status,
    durationMs: state.durationMs,
    remainingMs: effectiveRemaining,
    formattedTime,
    hours,
    minutes,
    seconds,
    progress,
    isFinished: isFinishedStatus,
    isUrgent,
    start,
    pause,
    resume,
    reset,
    restart,
    setDuration
  }
}
