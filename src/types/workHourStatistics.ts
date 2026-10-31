export interface WorkHourRow {
  userId: number
  employeeName: string
  departmentId: number
  departmentName: string
  planId: number
  planNo: string
  partId: number
  processId: number
  productName: string
  partName: string
  processName: string
  hours: number
  reportCount: number
}
export type WorkHourDimension = 'employee' | 'task' | 'department'
