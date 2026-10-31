import api, { type HttpResponse } from './module/api'
import type { PlanOperationReport } from '@/types/planOperationReportType'

export const planOperationReportApi = {
  list: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: PlanOperationReport[]; total: number }>>(
      '/api/plan-operation-reports/list',
      { params }
    ),
  approve: (id: number) => api.put(`/api/plan-operation-reports/${id}/approve`),
  reject: (id: number, rejectReason?: string) =>
    api.put(`/api/plan-operation-reports/${id}/reject`, { rejectReason }),
}
