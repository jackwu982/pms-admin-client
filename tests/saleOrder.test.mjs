import assert from 'node:assert/strict'
import test from 'node:test'
import { createSaleOrderForm, selectSaleOrderProduct } from '../src/utils/saleOrder.ts'

test('new orders begin with no items and use the supplied date', () => {
  const form = createSaleOrderForm(undefined, '2026-10-25')
  assert.equal(form.status, 0)
  assert.equal(form.orderDate, '2026-10-25')
  assert.deepEqual(form.items, [])
})

test('editing copies item objects and retains snapshots when selecting the same product', () => {
  const order = { id: 1, orderNo: 'SO-1', customerName: '客户', orderDate: '2026-10-01', status: 0, items: [{ productId: 2, productName: '原产品名', model: '原型号', unit: '件' }] }
  const original = structuredClone(order)
  const form = createSaleOrderForm(order)
  selectSaleOrderProduct(form, { id: 2, name: '新名称', model: '新型号' })
  assert.equal(form.items.length, 1)
  assert.equal(form.items[0].productName, '原产品名')
  form.items[0].unit = '台'
  form.items.splice(0, 1)
  assert.deepEqual(order, original)
})

test('multiple products are appended without replacing previous items', () => {
  const form = createSaleOrderForm()
  selectSaleOrderProduct(form, { id: 2, name: '产品二', model: '型号二' })
  selectSaleOrderProduct(form, { id: 3, name: '产品三', model: null })
  assert.deepEqual(form.items.map(i => i.productId), [2, 3])
  assert.equal(form.items[0].model, '型号二')
  assert.equal(form.items[1].model, '')
})

test('configuration details are copied independently and old orders default to an empty list', () => {
  assert.deepEqual(createSaleOrderForm().configurationDetails, [])
  const order = { items: [], configurationDetails: [{ code: '001', name: '配件', spec: 'A型', quantity: 2.5, unit: '米', remark: '备注' }] }
  const form = createSaleOrderForm(order)
  form.configurationDetails[0].quantity = 5
  form.configurationDetails.push({ code: '002', name: '', spec: '', quantity: null, unit: '', remark: '' })
  assert.equal(order.configurationDetails[0].quantity, 2.5)
  assert.equal(order.configurationDetails.length, 1)
  assert.equal(form.configurationDetails[0].code, '001')
})
