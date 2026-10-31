import * as XLSX from 'xlsx'
import type { WorkHourRow, WorkHourDimension } from '../types/workHourStatistics.ts'
import { groupWorkHours } from './workHourStatistics.ts'

export async function fetchAllWorkHours(
  fetchPage: (pageNum: number, pageSize: number) => Promise<{ list: WorkHourRow[]; total: number }>,
  onProgress: (loaded: number, total: number) => void = () => {}
) {
  const rows: WorkHourRow[] = []
  let total = Infinity
  for (let page = 1; rows.length < total; page++) {
    const result = await fetchPage(page, 500)
    total = result.total
    if (!result.list.length && rows.length < total) throw new Error('分页数据不完整，请重新导出')
    rows.push(...result.list)
    onProgress(rows.length, total)
  }
  return rows
}

export function workHourWorkbook(rows: WorkHourRow[], startDate?: string, endDate?: string) {
  const book = XLSX.utils.book_new()
  const labels: Record<WorkHourDimension, string> = {
    employee: '员工',
    task: '任务',
    department: '部门',
  }
  const range = ['统计日期', startDate || '不限', '至', endDate || '不限']
  for (const dimension of ['employee', 'task', 'department'] as const) {
    const groups = groupWorkHours(rows, dimension)
    const label = labels[dimension]
    const summary = [
      range,
      [
        label,
        ...(dimension === 'employee' ? ['部门'] : ['参与人数']),
        ...(dimension !== 'task' ? ['涉及任务数'] : []),
        '上报次数',
        '总工时（小时）',
        '工时占比（%）',
      ],
      ...groups.map((g) => [
        g.name,
        dimension === 'employee' ? g.departmentName : g.employeeCount,
        ...(dimension !== 'task' ? [g.taskCount] : []),
        g.reportCount,
        g.hours,
        g.percent,
      ]),
    ]
    const detail = [
      range,
      [
        label,
        ...(dimension === 'department' ? ['员工'] : []),
        ...(dimension !== 'task' ? ['任务（生产计划）'] : []),
        '产品',
        '部件',
        '工序',
        '上报次数',
        '工时（小时）',
      ],
      ...groups.flatMap((g) =>
        g.details.map((d) => [
          g.name,
          ...(dimension === 'department' ? [d.employeeName] : []),
          ...(dimension !== 'task' ? [d.planNo] : []),
          d.productName,
          d.partName,
          d.processName,
          d.reportCount,
          d.hours,
        ])
      ),
    ]
    for (const [suffix, data] of [
      ['汇总', summary],
      ['明细', detail],
    ] as const) {
      const sheet = XLSX.utils.aoa_to_sheet(data)
      sheet['!cols'] = data[1]!.map(() => ({ wch: 24 }))
      XLSX.utils.book_append_sheet(book, sheet, `${label}${suffix}`)
    }
  }
  return book
}
