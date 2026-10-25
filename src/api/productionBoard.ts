import api, { type HttpResponse } from './module/api'
import type { PlanProgress } from '@/types/productionBoardType'

export const productionBoardApi = {
  list: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: PlanProgress[]; total: number }>>(
      '/api/production-plans/board',
      { params }
    ),
}
