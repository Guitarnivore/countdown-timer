import { describe, expect, it } from 'vitest'
import { sliderPercentToUnit, themeAttribute, unitToSliderPercent } from './model'

describe('themeAttribute', () => {
  it('removes the attribute for system so the OS preference applies', () => {
    expect(themeAttribute('system')).toBeNull()
  })

  it('maps explicit themes to the data-theme value', () => {
    expect(themeAttribute('light')).toBe('light')
    expect(themeAttribute('dark')).toBe('dark')
  })
})

describe('slider conversions', () => {
  it('converts percent to a unit value', () => {
    expect(sliderPercentToUnit(0)).toBe(0)
    expect(sliderPercentToUnit(30)).toBe(0.3)
    expect(sliderPercentToUnit(100)).toBe(1)
  })

  it('clamps percent input and rejects non-finite values', () => {
    expect(sliderPercentToUnit(150)).toBe(1)
    expect(sliderPercentToUnit(-10)).toBe(0)
    expect(sliderPercentToUnit(Number.NaN)).toBe(0)
  })

  it('converts a unit value to a whole percent', () => {
    expect(unitToSliderPercent(0.3)).toBe(30)
    expect(unitToSliderPercent(0.675)).toBe(68)
  })

  it('clamps unit input and rejects non-finite values', () => {
    expect(unitToSliderPercent(2)).toBe(100)
    expect(unitToSliderPercent(-1)).toBe(0)
    expect(unitToSliderPercent(Number.NaN)).toBe(0)
  })
})
