function fraction(value) {
  const text = String(value ?? '')
  const match = text.match(/^(-?)(\d+)(?:\.(\d+))?$/)
  if (!match) return null
  const decimals = match[3] || ''
  const denominator = 10n ** BigInt(decimals.length)
  const sign = match[1] ? -1n : 1n
  return { numerator: sign * BigInt(`${match[2]}${decimals}`), denominator }
}

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a }
function add(a, b) {
  const common = a.denominator / gcd(a.denominator, b.denominator) * b.denominator
  return { numerator: a.numerator * (common / a.denominator) + b.numerator * (common / b.denominator), denominator: common }
}
function multiply(a, b) { return { numerator: a.numerator * b.numerator, denominator: a.denominator * b.denominator } }

const unitFamily = unit => {
  const value = String(unit || '').trim().toLowerCase()
  if (['kg', 'kilogram', 'kilograms'].includes(value)) return { family: 'mass', factor: [1000n, 1n] }
  if (['g', 'gram', 'grams'].includes(value)) return { family: 'mass', factor: [1n, 1n] }
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(value)) return { family: 'volume', factor: [1000n, 1n] }
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(value)) return { family: 'volume', factor: [1n, 1n] }
  if (['count', 'counts', 'piece', 'pieces'].includes(value)) return { family: 'count', factor: [1n, 1n] }
  return null
}

function conversion(from, to) {
  const source = unitFamily(from), target = unitFamily(to)
  if (!source || !target || source.family !== target.family) return null
  return { numerator: source.factor[0] * target.factor[1], denominator: source.factor[1] * target.factor[0] }
}

function roundedDecimal({ numerator, denominator }, places = 2) {
  const factor = 10n ** BigInt(places)
  const rounded = (numerator * factor * 2n + denominator) / (2n * denominator)
  const whole = rounded / factor
  const fractionPart = String(rounded % factor).padStart(places, '0').replace(/0+$/, '')
  return fractionPart ? `${whole}.${fractionPart}` : String(whole)
}

export function getStockMetrics(items = []) {
  let total = { numerator: 0n, denominator: 1n }
  let partial = false
  const suppliers = new Set()
  for (const item of items) {
    if (item.conversionError) partial = true
    for (const lot of item.lots || []) {
      const remaining = fraction(lot.remaining)
      if (!remaining) { partial = true; continue }
      if (remaining.numerator <= 0n) continue
      if (lot.supplier?.trim()) suppliers.add(lot.supplier.trim())
      const cost = fraction(lot.unitCost)
      const factor = conversion(lot.unit, lot.inputUnit)
      if (!cost || !factor || cost.numerator < 0n) { partial = true; continue }
      const lotValue = multiply(multiply(remaining, cost), { numerator: factor.numerator, denominator: factor.denominator })
      total = add(total, lotValue)
    }
  }
  return { value: roundedDecimal(total), partial, activeSuppliers: suppliers.size }
}

export function scaleDecimalByInteger(value, multiplier) {
  const parsed = fraction(value)
  if (!parsed || parsed.numerator < 0n || !Number.isSafeInteger(multiplier) || multiplier < 1 || multiplier > 100000) return null
  return roundedDecimal({ numerator: parsed.numerator * BigInt(multiplier), denominator: parsed.denominator }, Math.max(2, String(value).split('.')[1]?.length || 0))
}
