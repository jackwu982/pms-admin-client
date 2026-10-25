import assert from 'node:assert/strict'
import test from 'node:test'
import { standardWork, estimateCapacity } from '../src/utils/capacity.ts'
test('converts minutes into hours before estimating days', () => {
  assert.deepEqual(estimateCapacity(120, 100, 5, 8), { totalMinutes: 12000, totalHours: 200, dailyHours: 40, days: 5 })
  assert.equal(estimateCapacity(30, 3, 2, 8).days, 0.09375)
})
test('only enabled standard operations under enabled parts are included', () => {
  const product = { parts: [
    { name: '甲', status: 1, operations: [{ id: 1, name: '工序1', status: 1, standardFlag: 1, stdTime: 10 }, { status: 0, standardFlag: 1, stdTime: 90 }, { status: 1, standardFlag: 0, stdTime: 80 }] },
    { name: '乙', status: 0, operations: [{ status: 1, standardFlag: 1, stdTime: 70 }] },
    { name: '丙', status: 1, operations: [{ id: 2, name: '工序2', status: 1, standardFlag: 1, stdTime: 20 }] },
  ] }
  const before = structuredClone(product)
  const work = standardWork(product)
  assert.equal(work.minutes, 30); assert.equal(work.operations.length, 2); assert.equal(work.incomplete, false)
  assert.deepEqual(product, before)
})
test('missing standard time is reported rather than treated as free work', () => {
  for (const stdTime of [null, undefined, 0, -1, NaN]) {
    assert.equal(standardWork({ parts: [{ status: 1, operations: [{ status: 1, standardFlag: 1, stdTime }] }] }).incomplete, true)
  }
  assert.equal(standardWork({}).operations.length, 0)
})
test('invalid quantities staffing and daily hours cannot produce estimates', () => {
  for (const args of [[10, 0, 1, 8], [10, 1, 0, 8], [10, 1.5, 1, 8], [10, 1, 1.5, 8], [10, 1, 1, 0], [10, 1, 1, 25], [0, 1, 1, 8], [NaN, 1, 1, 8], [10, undefined, 1, 8]]) assert.equal(estimateCapacity(...args), null)
})
