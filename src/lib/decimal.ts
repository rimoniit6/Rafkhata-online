// Prisma returns Decimal as strings. These helpers handle arithmetic.
export type DecimalLike = number | string | { toString(): string }

export function toDecimal(val: DecimalLike): number {
  return Number(String(val))
}

export function decimalAdd(a: DecimalLike, b: DecimalLike): number {
  return toDecimal(a) + toDecimal(b)
}

export function decimalSub(a: DecimalLike, b: DecimalLike): number {
  return toDecimal(a) - toDecimal(b)
}

export function decimalMul(a: DecimalLike, b: DecimalLike): number {
  return toDecimal(a) * toDecimal(b)
}

export function decimalDiv(a: DecimalLike, b: DecimalLike): number {
  const divisor = toDecimal(b)
  return divisor === 0 ? 0 : toDecimal(a) / divisor
}

export function formatPrice(val: DecimalLike): string {
  return toDecimal(val).toFixed(2)
}

export function formatMarks(val: DecimalLike): string {
  return toDecimal(val).toFixed(2)
}
