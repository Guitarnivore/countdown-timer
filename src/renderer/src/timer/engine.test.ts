import { describe, expect, it, vi } from 'vitest'
import {
  createTimer,
  getRemainingMs,
  isFinished,
  pause,
  reset,
  resume,
  start,
  tick,
  validateDuration
} from './engine'
import { formatRemaining, parseDigits } from './format'

describe('Timer Engine', () => {
  it('start sets endAtMs = now + remainingMs; status becomes running', () => {
    const timer = createTimer(60000)
    const started = start(timer, 1000)
    expect(started.status).toBe('running')
    expect(started.endAtMs).toBe(1000 + 60000)
    expect(started.remainingMs).toBe(60000)
  })

  it('getRemainingMs decreases exactly with the injected clock; never negative', () => {
    const timer = createTimer(5000)
    const running = start(timer, 1000) // endAtMs = 6000

    expect(getRemainingMs(running, 1000)).toBe(5000)
    expect(getRemainingMs(running, 2500)).toBe(3500)
    expect(getRemainingMs(running, 5999)).toBe(1)
    expect(getRemainingMs(running, 6000)).toBe(0)
    expect(getRemainingMs(running, 7000)).toBe(0)
  })

  it('pause freezes remaining; time passing while paused changes nothing; resume continues from the frozen value', () => {
    const timer = createTimer(10000)
    const running = start(timer, 0) // ends at 10000

    // Pause at t = 3000 (3s elapsed of 10s, 7s remaining)
    const paused = pause(running, 3000)
    expect(paused.status).toBe('paused')
    expect(paused.remainingMs).toBe(7000)
    expect(paused.endAtMs).toBeNull()

    // Time passes while paused (from t = 3000 to t = 15000)
    expect(getRemainingMs(paused, 5000)).toBe(7000)
    expect(getRemainingMs(paused, 15000)).toBe(7000)

    // Resume at t = 20000
    const resumed = resume(paused, 20000)
    expect(resumed.status).toBe('running')
    expect(resumed.endAtMs).toBe(20000 + 7000)
    expect(getRemainingMs(resumed, 20000)).toBe(7000)
    expect(getRemainingMs(resumed, 22000)).toBe(5000)
  })

  it('pause/resume repeated 100 times does not accumulate drift', () => {
    const initialDurationMs = 600000 // 10 minutes
    let state = createTimer(initialDurationMs)
    let clock = 1000

    state = start(state, clock)

    for (let i = 0; i < 100; i++) {
      clock += 25 // running for 25 ms
      state = pause(state, clock)
      clock += 500 // paused for 500 ms (must not count)
      state = resume(state, clock)
    }

    // Total running time elapsed should be exactly 100 * 25ms = 2500ms
    const expectedRemaining = initialDurationMs - 100 * 25
    expect(getRemainingMs(state, clock)).toBe(expectedRemaining)
    expect(state.remainingMs).toBe(expectedRemaining)
  })

  it('a large clock jump forward (simulated sleep of 1 hour) while running ends the timer as finished and remaining = 0', () => {
    const timer = createTimer(300000) // 5 minutes
    const running = start(timer, 1000) // ends at 301000

    // Clock jumps by 1 hour (3600000 ms) to t = 3601000
    const sleepWakeClock = 1000 + 3600000
    expect(isFinished(running, sleepWakeClock)).toBe(true)
    expect(getRemainingMs(running, sleepWakeClock)).toBe(0)

    const finished = tick(running, sleepWakeClock)
    expect(finished.status).toBe('finished')
    expect(finished.remainingMs).toBe(0)
    expect(finished.endAtMs).toBeNull()
    expect(getRemainingMs(finished, sleepWakeClock)).toBe(0)
  })

  it('isFinished/onFinish fires exactly once, even when the tick is evaluated twice at the end', () => {
    const timer = createTimer(1000)
    const running = start(timer, 0) // ends at 1000
    const onFinish = vi.fn()

    // Before finish
    let current = tick(running, 999, onFinish)
    expect(onFinish).not.toHaveBeenCalled()
    expect(current.status).toBe('running')

    // At finish
    current = tick(current, 1000, onFinish)
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(current.status).toBe('finished')

    // Evaluated again after finish (e.g. resync on focus or next tick)
    current = tick(current, 1010, onFinish)
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(isFinished(current, 1010)).toBe(false)
  })

  it('reset restores durationMs and idle status; works from every status', () => {
    const duration = 15000

    // From idle
    const idle = createTimer(duration)
    const resetFromIdle = reset(idle)
    expect(resetFromIdle).toEqual({
      status: 'idle',
      durationMs: duration,
      remainingMs: duration,
      endAtMs: null
    })

    // From running
    const running = start(idle, 1000)
    const resetFromRunning = reset(running)
    expect(resetFromRunning).toEqual({
      status: 'idle',
      durationMs: duration,
      remainingMs: duration,
      endAtMs: null
    })

    // From paused
    const paused = pause(running, 2000)
    const resetFromPaused = reset(paused)
    expect(resetFromPaused).toEqual({
      status: 'idle',
      durationMs: duration,
      remainingMs: duration,
      endAtMs: null
    })

    // From finished
    const finished = tick(running, 20000)
    const resetFromFinished = reset(finished)
    expect(resetFromFinished).toEqual({
      status: 'idle',
      durationMs: duration,
      remainingMs: duration,
      endAtMs: null
    })
  })

  it('rejects zero, negative, NaN and non-integer durations', () => {
    expect(() => createTimer(0)).toThrow()
    expect(() => createTimer(-500)).toThrow()
    expect(() => createTimer(NaN)).toThrow()
    expect(() => createTimer(12.34)).toThrow()
    expect(() => validateDuration(0)).toThrow()
    expect(() => validateDuration(-1000)).toThrow()
    expect(() => validateDuration(Number.NaN)).toThrow()
    expect(() => validateDuration(100.5)).toThrow()
    // Valid values should not throw
    expect(() => validateDuration(1000)).not.toThrow()
  })
})

describe('Formatting and Display', () => {
  it('display rounding: remaining 1 ms shows 00:01; 0 ms shows 00:00; 59 999 ms shows 01:00', () => {
    expect(formatRemaining(1)).toBe('00:01')
    expect(formatRemaining(0)).toBe('00:00')
    expect(formatRemaining(59999)).toBe('01:00')
  })

  it('formatRemaining: MM:SS under one hour, H:MM:SS above; 99:59:59 is the max', () => {
    expect(formatRemaining(1000)).toBe('00:01')
    expect(formatRemaining(59000)).toBe('00:59')
    expect(formatRemaining(60000)).toBe('01:00')
    expect(formatRemaining(59 * 60 * 1000 + 59 * 1000)).toBe('59:59')

    // At and above 1 hour
    expect(formatRemaining(60 * 60 * 1000)).toBe('1:00:00')
    expect(formatRemaining(61 * 60 * 1000 + 5 * 1000)).toBe('1:01:05')
    expect(formatRemaining(12 * 3600 * 1000 + 34 * 60 * 1000 + 56 * 1000)).toBe('12:34:56')

    // Maximum 99:59:59
    const maxMs = (99 * 3600 + 59 * 60 + 59) * 1000
    expect(formatRemaining(maxMs)).toBe('99:59:59')

    // Over maximum clamps to 99:59:59
    expect(formatRemaining(maxMs + 3600000)).toBe('99:59:59')
  })

  it('parseDigits: typing 1,2,0,0 gives 12:00; 1,0,0,0,0 gives 1:00:00; more than 6 digits ignored; leading zeros handled; overflow clamps to 99:59:59', () => {
    // typing 1,2,0,0 gives 12:00
    const r1 = parseDigits('1200')
    expect(r1.formatted).toBe('12:00')
    expect(r1.ms).toBe(12 * 60 * 1000)

    // Also supports comma-separated / array style input
    expect(parseDigits('1,2,0,0').formatted).toBe('12:00')
    expect(parseDigits([1, 2, 0, 0]).formatted).toBe('12:00')

    // 1,0,0,0,0 gives 1:00:00
    const r2 = parseDigits('10000')
    expect(r2.formatted).toBe('1:00:00')
    expect(r2.ms).toBe(3600 * 1000)
    expect(parseDigits([1, 0, 0, 0, 0]).formatted).toBe('1:00:00')

    // more than 6 digits ignored
    // e.g. typing 1, 2, 0, 0, 0, 0, then 9 -> the 7th digit 9 is ignored, keeping 12:00:00
    const r3 = parseDigits('1200009')
    expect(r3.formatted).toBe('12:00:00')
    expect(r3.ms).toBe(12 * 3600 * 1000)

    // leading zeros handled
    const r4 = parseDigits('001200')
    expect(r4.formatted).toBe('12:00')
    expect(r4.ms).toBe(12 * 60 * 1000)

    const r5 = parseDigits('0000')
    expect(r5.formatted).toBe('00:00')
    expect(r5.ms).toBe(0)

    // overflow clamps to 99:59:59
    const maxMs = (99 * 3600 + 59 * 60 + 59) * 1000
    const rOverflow = parseDigits('999999')
    expect(rOverflow.formatted).toBe('99:99:99')
    expect(rOverflow.ms).toBe(maxMs)
  })
})
