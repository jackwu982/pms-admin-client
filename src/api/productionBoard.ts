import api, { type HttpResponse } from './module/api'
import type { PlanProgress } from '@/types/productionBoardType'

export interface MaintenanceReminder {
  id: number
  code: string
  name: string
  ownerName?: string
  lastMaintenanceTime?: string
  maintenanceCycleDays?: number
  dueDate?: string
  remainingDays?: number | null
}
export const productionBoardApi = {
  report: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: PlanProgress[]; total: number }>>(
      '/api/production-plans/report',
      { params }
    ),
  todayReports: () =>
    api.get<
      unknown,
      HttpResponse<{
        date: string
        list: import('@/types/planOperationReportType').PlanOperationReport[]
      }>
    >('/api/plan-operation-reports/today'),
  maintenanceReminders: () =>
    api.get<unknown, HttpResponse<{ date: string; list: MaintenanceReminder[] }>>(
      '/api/equipment/maintenance-reminders'
    ),
  list: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: PlanProgress[]; total: number }>>(
      '/api/production-plans/board',
      { params }
    ),
}
