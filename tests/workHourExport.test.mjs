import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { fetchAllWorkHours, workHourWorkbook } from '../src/utils/workHourExport.ts'
const row = (id, hours = 1) => ({ userId:id, employeeName:`员工${id}`,departmentId:1,departmentName:'部门',planId:2,planNo:'计划',partId:3,processId:4,productName:'产品',partName:'部件',processName:'工序',hours,reportCount:1 })
test('fetches every page including final partial page', async () => {
  const pages = []
  const result = await fetchAllWorkHours(async (page,size) => {
    pages.push([page,size])
    return { list:page === 1 ? Array.from({length:500},(_,i)=>row(i)) : [row(500)],total:501 }
  })
  assert.equal(result.length,501)
  assert.deepEqual(pages,[[1,500],[2,500]])
})
test('empty data finishes and incomplete or failed pages reject', async () => {
  assert.deepEqual(await fetchAllWorkHours(async()=>({list:[],total:0})),[])
  await assert.rejects(fetchAllWorkHours(async()=>({list:[],total:5})))
  await assert.rejects(fetchAllWorkHours(async()=>{throw new Error('offline')}))
})
test('exports all dimensions with numeric totals and task details aggregated across employees', () => {
  const data = [row(1,0.1),row(2,0.2)]
  const before = structuredClone(data)
  const book = workHourWorkbook(data,'2026-10-01','2026-10-26')
  assert.deepEqual(book.SheetNames,['员工汇总','员工明细','任务汇总','任务明细','部门汇总','部门明细'])
  const summary = XLSX.utils.sheet_to_json(book.Sheets['任务汇总'],{header:1})
  assert.deepEqual(summary[2],['计划',2,2,0.3,100])
  const detail = XLSX.utils.sheet_to_json(book.Sheets['任务明细'],{header:1})
  assert.equal(detail.length,3)
  assert.deepEqual(detail[2],['计划','产品','部件','工序',2,0.3])
  assert.deepEqual(data,before)
  const bytes = XLSX.write(book,{type:'buffer',bookType:'xlsx'})
  assert.equal(XLSX.read(bytes).SheetNames.length,6)
})
