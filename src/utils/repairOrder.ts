// Multiply thousandths of a unit by cents and round half up to cents.
export function materialCents(quantity: number, price: number): bigint {
  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(price) ||
    quantity < 0 ||
    price < 0 ||
    quantity > 99999999.999 ||
    price > 99999999.99
  )
    return 0n
  const units = BigInt(quantity.toFixed(3).replace('.', ''))
  const cents = BigInt(price.toFixed(2).replace('.', ''))
  return (units * cents + 500n) / 1000n
}
export function formatCents(cents: bigint): string {
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`
}
export function materialTotal(quantity: number, price: number): string {
  return formatCents(materialCents(quantity, price))
}
