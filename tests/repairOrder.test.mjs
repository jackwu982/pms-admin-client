import assert from 'node:assert/strict'
import test from 'node:test'
import { materialTotal, materialCents, formatCents } from '../src/utils/repairOrder.ts'

test('material totals round half up with three-decimal quantities', () => {
  assert.equal(materialTotal(1.005, 1), '1.01')
  assert.equal(materialTotal(2.5, 12.3), '30.75')
  assert.equal(materialTotal(0.001, 5), '0.01')
  assert.equal(materialTotal(3, 0), '0.00')
})
test('large prices and summed rows retain exact cents', () => {
  assert.equal(materialTotal(99999999.999, 99999999.99), '9999999998900000.00')
  assert.equal(formatCents(materialCents(1.005, 1) + materialCents(2.5, 12.3)), '31.76')
})
test('empty or invalid editor values display a safe total', () => {
  for (const quantity of [undefined, null, NaN, -1, Infinity]) assert.equal(materialTotal(quantity, 1), '0.00')
})
