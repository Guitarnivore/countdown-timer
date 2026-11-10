import { describe, expect, it } from 'vitest'
import { parseDigits } from './format'

describe('Keypad digit shifting (right-to-left fill)', () => {
  it('typing 5 then 0 yields 50 seconds', () => {
    const r = parseDigits('50')
    expect(r.formatted).toBe('00:50')
    expect(r.ms).toBe(50 * 1000)
    expect(r.totalSeconds).toBe(50)
  })

  it('typing 5, 0, 0 yields 5 minutes', () => {
    const r = parseDigits('500')
    expect(r.formatted).toBe('05:00')
    expect(r.ms).toBe(5 * 60 * 1000)
    expect(r.totalSeconds).toBe(300)
  })

  it('keeps entered seconds unnormalized until the timer starts', () => {
    const r = parseDigits('90')
    expect(r.formatted).toBe('00:90')
    expect(r.ms).toBe(90 * 1000)
  })

  it('typing 1, 2, 0, 0 yields 12 minutes 00 seconds', () => {
    const r = parseDigits('1200')
    expect(r.formatted).toBe('12:00')
    expect(r.ms).toBe(12 * 60 * 1000)
    expect(r.totalSeconds).toBe(720)
  })

  it('typing 1, 0, 0, 0, 0 yields 1 hour 00 minutes 00 seconds', () => {
    const r = parseDigits('10000')
    expect(r.formatted).toBe('1:00:00')
    expect(r.ms).toBe(3600 * 1000)
    expect(r.totalSeconds).toBe(3600)
  })

  it('preserves entered fields while clamping the duration', () => {
    const r = parseDigits('999999')
    expect(r.formatted).toBe('99:99:99')
    expect(r.ms).toBe((99 * 3600 + 59 * 60 + 59) * 1000)
  })

  it('typing 000 yields 00:00', () => {
    const r = parseDigits('000')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('typing 0000 yields 00:00', () => {
    const r = parseDigits('0000')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('typing 00000 yields 00:00', () => {
    const r = parseDigits('00000')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('typing 000000 yields 00:00', () => {
    const r = parseDigits('000000')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('typing 01 yields 00:01', () => {
    const r = parseDigits('01')
    expect(r.formatted).toBe('00:01')
    expect(r.ms).toBe(1000)
  })

  it('typing 1, 2, 3, 4, 5, 6 yields 12:34:56', () => {
    const r = parseDigits('123456')
    expect(r.formatted).toBe('12:34:56')
    expect(r.ms).toBe((12 * 3600 + 34 * 60 + 56) * 1000)
  })

  it('typing 7, 5, 3, 0, 0, 0 yields 75:30:00', () => {
    const r = parseDigits('753000')
    expect(r.formatted).toBe('75:30:00')
    expect(r.ms).toBe((75 * 3600 + 30 * 60) * 1000)
  })

  it('typing 1, 2, 3, 4, 5, 6, 7 ignores the 7th digit', () => {
    const r = parseDigits('1234567')
    expect(r.formatted).toBe('12:34:56')
    expect(r.ms).toBe((12 * 3600 + 34 * 60 + 56) * 1000)
  })

  it('typing 00 yields 00:00', () => {
    const r = parseDigits('00')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('typing 0 yields 00:00', () => {
    const r = parseDigits('0')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('empty input yields 00:00', () => {
    const r = parseDigits('')
    expect(r.formatted).toBe('00:00')
    expect(r.ms).toBe(0)
  })

  it('array input [5, 0, 0] yields 5 minutes', () => {
    const r = parseDigits([5, 0, 0])
    expect(r.formatted).toBe('05:00')
    expect(r.ms).toBe(5 * 60 * 1000)
  })

  it('array input [1, 2, 0, 0] yields 12 minutes', () => {
    const r = parseDigits([1, 2, 0, 0])
    expect(r.formatted).toBe('12:00')
    expect(r.ms).toBe(12 * 60 * 1000)
  })

  it('array input [1, 0, 0, 0, 0] yields 1 hour', () => {
    const r = parseDigits([1, 0, 0, 0, 0])
    expect(r.formatted).toBe('1:00:00')
    expect(r.ms).toBe(3600 * 1000)
  })
})
