import type { WorkHourRow, WorkHourDimension } from '../types/workHourStatistics.ts'

export function summarizeWorkHours(rows: WorkHourRow[]) {
  const totalMillis = rows.reduce((sum, row) => sum + Math.round(Number(row.hours || 0) * 1000), 0)
  return {
    hours: totalMillis / 1000,
    employees: new Set(rows.map((row) => row.userId)).size,
    tasks: new Set(rows.map((row) => row.planId)).size,
    departments: new Set(rows.map((row) => row.departmentId ?? 0)).size,
  }
}

export function groupWorkHours(rows: WorkHourRow[], dimension: WorkHourDimension) {
  const groups = new Map<
    number,
    {
      id: number
      name: string
      departmentName: string
      millis: number
      employees: Set<number>
      tasks: Set<number>
      reportCount: number
      details: Map<string, WorkHourRow & { millis: number }>
    }
  >()
  for (const row of rows) {
    const id =
      dimension === 'employee'
        ? row.userId
        : dimension === 'task'
          ? row.planId
          : (row.departmentId ?? 0)
    let group = groups.get(id)
    if (!group) {
      group = {
        id,
        name:
          dimension === 'employee'
            ? row.employeeName || `用户${row.userId}`
            : dimension === 'task'
              ? row.planNo || `计划${row.planId}`
              : row.departmentName || '未分配部门',
        departmentName: row.departmentName || '未分配部门',
        millis: 0,
        employees: new Set(),
        tasks: new Set(),
        reportCount: 0,
        details: new Map(),
      }
      groups.set(id, group)
    }
    const millis = Math.round(Number(row.hours || 0) * 1000)
    group.millis += millis
    group.employees.add(row.userId)
    group.tasks.add(row.planId)
    group.reportCount += Number(row.reportCount)
    // Aggregate task detail across employees, while retaining distinct product/part processes.
    const key = JSON.stringify([
      dimension === 'task' ? null : row.userId,
      row.planId,
      row.partId,
      row.processId,
    ])
    const detail = group.details.get(key)
    if (detail) {
      detail.millis += millis
      detail.reportCount += Number(row.reportCount)
    } else group.details.set(key, { ...row, reportCount: Number(row.reportCount), millis })
  }
  const total = [...groups.values()].reduce((sum, group) => sum + group.millis, 0)
  return [...groups.values()]
    .map((group) => ({
      id: group.id,
      name: group.name,
      departmentName: group.departmentName,
      hours: group.millis / 1000,
      employeeCount: group.employees.size,
      taskCount: group.tasks.size,
      reportCount: group.reportCount,
      percent: total ? Math.round((group.millis / total) * 10000) / 100 : 0,
      details: [...group.details.values()]
        .map((detail) => ({ ...detail, hours: detail.millis / 1000 }))
        .sort((a, b) => b.hours - a.hours),
    }))
    .sort((a, b) => b.hours - a.hours || a.id - b.id)
}
