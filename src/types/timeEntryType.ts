export interface TimeEntry {
  id?: number
  userId: number
  nickname?: string
  departmentId?: number
  departmentName?: string
  taskId: number
  taskName?: string
  processId?: number
  processName?: string
  hours: number
}
