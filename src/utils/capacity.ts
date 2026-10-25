import type { Product } from '../types/productType.ts'

export function standardWork(product: Product) {
  const operations = (product.parts ?? [])
    .filter((part) => part.status === 1)
    .flatMap((part) =>
      (part.operations ?? [])
        .filter((operation) => operation.status === 1 && operation.standardFlag === 1)
        .map((operation) => ({
          id: operation.id,
          partName: part.name,
          name: operation.name,
          minutes: operation.stdTime,
        }))
    )
  const incomplete = operations.some(
    (operation) => !Number.isFinite(operation.minutes) || Number(operation.minutes) <= 0
  )
  return {
    operations,
    incomplete,
    minutes: operations.reduce((sum, operation) => sum + (Number(operation.minutes) || 0), 0),
  }
}

export function estimateCapacity(
  minutes: number,
  quantity: number,
  people: number,
  hoursPerDay: number
) {
  if (
    !Number.isFinite(minutes) ||
    minutes <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isSafeInteger(people) ||
    people <= 0 ||
    !Number.isFinite(hoursPerDay) ||
    hoursPerDay <= 0 ||
    hoursPerDay > 24
  )
    return null
  const totalMinutes = minutes * quantity
  const totalHours = totalMinutes / 60
  const dailyHours = people * hoursPerDay
  const days = totalHours / dailyHours
  if (![totalMinutes, totalHours, dailyHours, days].every(Number.isFinite)) return null
  return { totalMinutes, totalHours, dailyHours, days }
}
