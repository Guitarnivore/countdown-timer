import { describe, expect, it } from 'vitest'
import { CHIME_MAX_REPEATS, chimeBusGain, clampUnit, planChime } from './chime'

describe('planChime', () => {
  it('plays a two-note phrase per repeat', () => {
    expect(planChime(1)).toHaveLength(2)
  })

  it('never plays more than three repeats', () => {
    expect(planChime(10)).toHaveLength(CHIME_MAX_REPEATS * 2)
    expect(planChime(CHIME_MAX_REPEATS)).toHaveLength(6)
  })

  it('returns no notes for zero, negative, or sub-one counts', () => {
    expect(planChime(0)).toEqual([])
    expect(planChime(-2)).toEqual([])
    expect(planChime(0.5)).toEqual([])
  })

  it('schedules notes in strictly increasing start order', () => {
    const starts = planChime(CHIME_MAX_REPEATS).map((note) => note.startSec)
    const sorted = [...starts].sort((a, b) => a - b)
    expect(starts).toEqual(sorted)
    expect(new Set(starts).size).toBe(starts.length)
  })

  it('leaves a gap between repeats', () => {
    const notes = planChime(2)
    const lastOfFirst = notes[1]
    const firstOfSecond = notes[2]
    expect(
      firstOfSecond.startSec - (lastOfFirst.startSec + lastOfFirst.durationSec)
    ).toBeGreaterThan(0)
  })
})

describe('chimeBusGain', () => {
  it('scales volume into a bus gain with headroom', () => {
    expect(chimeBusGain(0)).toBe(0)
    expect(chimeBusGain(1)).toBe(0.25)
  })

  it('clamps out-of-range volume', () => {
    expect(chimeBusGain(-1)).toBe(0)
    expect(chimeBusGain(5)).toBe(0.25)
  })
})

describe('clampUnit', () => {
  it('returns 0 for non-finite values', () => {
    expect(clampUnit(Number.NaN)).toBe(0)
    expect(clampUnit(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('clamps to the 0..1 range', () => {
    expect(clampUnit(-0.5)).toBe(0)
    expect(clampUnit(0.4)).toBe(0.4)
    expect(clampUnit(2)).toBe(1)
  })
})
