import assert from 'node:assert/strict'
import test from 'node:test'
import { createSaleOrderForm, selectSaleOrderProduct } from '../src/utils/saleOrder.ts'

test('new orders default to draft with the supplied local date', () => {
  const form = createSaleOrderForm(undefined, '2026-10-24')
  assert.equal(form.status, 0)
  assert.equal(form.orderDate, '2026-10-24')
  assert.equal(form.productId, undefined)
})

test('editing preserves historical snapshots and does not mutate the order', () => {
  const order = {
    id: 1,
    orderNo: 'SO-1',
    customerName: '客户',
    orderDate: '2026-10-01',
    productId: 2,
    productName: '原产品名',
    model: '原型号',
    status: 0,
    unit: null,
    remark: null,
  }
  const original = structuredClone(order)
  const form = createSaleOrderForm(order, '2026-10-24')
  selectSaleOrderProduct(form, { id: 2, name: '新产品名', model: '新型号' })
  assert.equal(form.productName, '原产品名')
  assert.equal(form.model, '原型号')
  assert.equal(form.orderDate, '2026-10-01')
  assert.equal(form.unit, '')
  form.customerName = '另一客户'
  assert.deepEqual(order, original)
})

test('changing product replaces both snapshots and clears the previous model', () => {
  const form = createSaleOrderForm()
  selectSaleOrderProduct(form, { id: 2, name: '产品二', model: '型号二' })
  assert.equal(form.model, '型号二')
  selectSaleOrderProduct(form, { id: 3, name: '产品三', model: null })
  assert.equal(form.productId, 3)
  assert.equal(form.productName, '产品三')
  assert.equal(form.model, '')
})
