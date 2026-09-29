import { describe, expect, it } from 'vitest'
import { getStockMetrics, scaleDecimalByInteger } from './stockMetrics'

describe('source-backed kitchen metrics and portion preview math', () => {
  it('values only positive lots with exact unit conversion and unique named suppliers', () => {
    const result = getStockMetrics([
      { name: 'Rice', lots: [
        { remaining: '1500', unit: 'g', inputUnit: 'kg', unitCost: '80', supplier: ' A ' },
        { remaining: '0', unit: 'kg', inputUnit: 'kg', unitCost: '80', supplier: 'B' },
      ] },
      { name: 'Oil', lots: [{ remaining: '2', unit: 'L', inputUnit: 'L', unitCost: '100', supplier: 'A' }] },
    ])
    expect(result).toMatchObject({ value: '320', activeSuppliers: 1, partial: false })
  })

  it('marks invalid or unknown-valued stock as partial without hiding known suppliers', () => {
    const result = getStockMetrics([{ name: 'Spice', lots: [
      { remaining: '2', unit: 'packet', inputUnit: 'packet', unitCost: '8', supplier: 'Vendor' },
      { remaining: 'unknown', unit: 'kg', inputUnit: 'kg', unitCost: '4', supplier: 'Other' },
    ] }])
    expect(result.partial).toBe(true)
    expect(result.activeSuppliers).toBe(1)
  })

  it('scales the approved 350 cover example exactly and rejects unsafe multipliers', () => {
    expect(scaleDecimalByInteger('0.00003', 350)).toBe('0.0105')
    expect(scaleDecimalByInteger('1.25', 350)).toBe('437.5')
    expect(scaleDecimalByInteger('1', 100001)).toBeNull()
  })
})
