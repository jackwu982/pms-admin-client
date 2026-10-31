import assert from 'node:assert/strict'
import test from 'node:test'
import { planOperationTarget } from '../src/utils/planOperation.ts'

test('standard operation uses quantity and clears the old duration', () => {
  assert.deepEqual(planOperationTarget(1, 25, 6), { totalQuantity: 25, totalHours: 0 })
})
test('nonstandard operation uses hours and clears the old quantity', () => {
  assert.deepEqual(planOperationTarget(0, 25, 2.5), { totalQuantity: 0, totalHours: 2.5 })
})
test('requires a positive integer quantity for standard operations', () => {
  for (const value of [undefined, 0, -1, 1.5, NaN, Infinity, 2147483648]) {
    assert.throws(() => planOperationTarget(1, value, 10))
  }
})
test('requires finite positive hours for nonstandard operations', () => {
  for (const value of [undefined, 0, 0.001, -1, NaN, Infinity, 100000000]) {
    assert.throws(() => planOperationTarget(0, 10, value))
  }
})
