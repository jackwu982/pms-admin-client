import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeWorkHours, groupWorkHours } from '../src/utils/workHourStatistics.ts'
const row = (values = {}) => ({ userId: 1, employeeName: '同名', departmentId: 10, departmentName: '生产部', planId: 100, planNo: 'PLAN-100', partId: 1000, processId: 10000, productName: '产品', partName: '部件', processName: '同名工序', hours: 0.1, reportCount: 1, ...values })
test('all three dimensions reconcile to summary and group by ids rather than names', () => {
  const rows = [row(), row({hours: 0.2}), row({userId:2, hours:1.5}), row({userId:3, departmentId:0, departmentName:'未分配部门', planId:101, hours:2})]
  const before = structuredClone(rows)
  assert.deepEqual(summarizeWorkHours(rows), {hours:3.8, employees:3, tasks:2, departments:2})
  for (const dimension of ['employee','task','department']) {
    const groups = groupWorkHours(rows, dimension)
    assert.equal(Math.round(groups.reduce((sum,g)=>sum+g.hours,0)*1000),3800)
    assert.equal(groups.reduce((sum,g)=>sum+g.reportCount,0),4)
  }
  assert.equal(groupWorkHours(rows,'employee').length,3)
  assert.equal(groupWorkHours(rows,'department').find(g=>g.id===10).employeeCount,2)
  assert.deepEqual(rows,before)
})
test('task details combine employee hours without merging distinct same-name processes', () => {
  const groups = groupWorkHours([row(),row({userId:2,hours:0.2}),row({partId:1001,processId:10001,hours:1})],'task')
  assert.equal(groups[0].details.length,2)
  assert.equal(groups[0].details.find(d=>d.processId===10000).hours,0.3)
  assert.equal(groups[0].employeeCount,2)
})
test('zero hours and empty data produce finite percentages', () => {
  assert.deepEqual(groupWorkHours([],'employee'),[])
  assert.equal(groupWorkHours([row({hours:0})],'employee')[0].percent,0)
})
