import api, { type HttpResponse } from './module/api'
import type {
  ProductionPlan,
  PlanPart,
  PlanOperation,
  PlanMember,
} from '@/types/productionPlanType'
function resource<T>(path: string) {
  return {
    list: (params: Record<string, unknown>) =>
      api.get<unknown, HttpResponse<{ list: T[]; total: number }>>(`/api/${path}/list`, { params }),
    get: (id: number) => api.get<unknown, HttpResponse<T>>(`/api/${path}/${id}`),
    create: (body: Omit<T, 'id' | 'parts' | 'members' | 'operations'>) =>
      api.post<unknown, HttpResponse<T>>(`/api/${path}`, body),
    update: (body: Partial<T> & { id: number }) =>
      api.put<unknown, HttpResponse<T>>(`/api/${path}`, body),
  }
}
export const productionPlanApi = resource<ProductionPlan>('production-plans')
export const planPartApi = resource<PlanPart>('plan-parts')
export const planOperationApi = resource<PlanOperation>('plan-operations')
export const planMemberApi = resource<PlanMember>('production-plan-members')
