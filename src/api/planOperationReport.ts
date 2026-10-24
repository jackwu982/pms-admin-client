import api, { type HttpResponse } from './module/api'
import type { PlanOperationReport } from '@/types/planOperationReportType'

export const planOperationReportApi = {
  list: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: PlanOperationReport[]; total: number }>>(
      '/api/plan-operation-reports/list',
      { params }
    ),
}
