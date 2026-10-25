import test from 'node:test'
import assert from 'node:assert/strict'
import { planCharts, reportCharts, maintenanceCharts, operationProgressChart } from '../src/utils/boardCharts.ts'

test('missing targets are separate from genuine zero progress', () => {
  const options = planCharts([{planNo:'未配置',progress:null},{planNo:'零进度',progress:0},{planNo:'完成',progress:100}])
  assert.deepEqual(options.progress.yAxis.data,['零进度','完成'])
  assert.deepEqual(options.progress.series[0].data.map(d=>d.value),[0,100])
})
test('daily hours use saved report hours and distinct plan ids', () => {
  const options = reportCharts([{planId:1,planNo:'同名',standardFlag:1,workHours:0.1},{planId:1,planNo:'同名',standardFlag:1,workHours:0.2},{planId:1,planNo:'同名',standardFlag:0,workHours:2},{planId:2,planNo:'同名',standardFlag:0,workHours:1}])
  assert.deepEqual(options.hours.series[0].data,[0.3,0])
  assert.deepEqual(options.hours.series[1].data,[2,1])
})
test('maintenance separates unknown dates and orders overdue first without mutating rows', () => {
  const rows = [{code:'A',name:'设备A',remainingDays:7},{code:'B',name:'设备B',remainingDays:null},{code:'C',name:'设备C',remainingDays:-14},{code:'D',name:'设备D',remainingDays:0}]
  const original = structuredClone(rows)
  const options = maintenanceCharts(rows)
  assert.deepEqual(options.status.series[0].data.map(d=>d.value),[1,2,1])
  assert.deepEqual(options.due.series[0].data.map(d=>d.value),[-14,0,7])
  assert.deepEqual(rows,original)
})

test('operation chart preserves distinct operations and labels missing targets explicitly', () => {
  const operations = [
    {id:1,productName:'产品甲',partName:'部件',processName:'同名工序',progress:null,actual:3,target:null,standardFlag:0},
    {id:2,productName:'产品乙',partName:'部件',processName:'同名工序',progress:0,actual:0,target:10,standardFlag:1},
    {id:3,productName:'产品乙',partName:'部件',processName:'工序3',progress:100,actual:12,target:10,standardFlag:1},
  ]
  const chart = operationProgressChart({operations})
  assert.deepEqual(chart.yAxis.data,['1','2','3'])
  assert.match(chart.series[0].label.formatter({dataIndex:0}),/待配置目标/)
  assert.match(chart.series[0].label.formatter({dataIndex:1}),/0%/)
  assert.deepEqual(chart.series[0].data.map(d=>d.value),[0,0,100])
  assert.match(chart.tooltip.formatter([{dataIndex:2}]),/12 件（合格）/)
})
