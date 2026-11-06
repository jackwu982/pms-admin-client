import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { fetchAllReports, reportWorkbook } from '../src/utils/planOperationReportExport.ts'

test('report export fetches all pages and rejects incomplete data', async () => {
  const pages = []
  const rows = await fetchAllReports(async (page, size) => {
    pages.push([page, size])
    return { list: page === 1 ? Array.from({ length: 500 }, (_, id) => ({ id })) : [{ id: 500 }], total: 501 }
  })
  assert.equal(rows.length, 501)
  assert.deepEqual(pages, [[1, 500], [2, 500]])
  assert.deepEqual(await fetchAllReports(async () => ({ list: [], total: 0 })), [])
  await assert.rejects(fetchAllReports(async () => ({ list: [], total: 1 })))
  await assert.rejects(fetchAllReports(async () => { throw new Error('offline') }))
})

test('report workbook preserves dates, numeric hours, statuses and input', () => {
  const rows = [{ id: 1, reporterName: '张三', reportTime: '2026-11-06T00:00:00', standardFlag: 1,
    reportQty: 5, qualifiedQty: 4, defectQty: 1, workHours: '2.5', status: 1 },
  { id: 2, reportTime: '2026-11-05', standardFlag: 0, workHours: 3, status: 2, rejectReason: '需补充' }]
  const before = structuredClone(rows)
  const book = reportWorkbook(rows)
  const data = XLSX.utils.sheet_to_json(book.Sheets['上报记录'], { header: 1 })
  assert.equal(data[1][2], '2026-11-06')
  assert.deepEqual(data[1].slice(9, 14), [5, 4, 1, 2.5, '已通过'])
  assert.deepEqual(data[2].slice(9, 14), ['', '', '', 3, '已驳回'])
  assert.equal(data[2][15], '需补充')
  assert.deepEqual(rows, before)
})
