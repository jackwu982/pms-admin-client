import api, { type HttpResponse } from './module/api'
import type { SaleOrder, SaleOrderPayload } from '@/types/saleOrderType'

export const saleOrderApi = {
  list: (params: Record<string, unknown>) =>
    api.get<unknown, HttpResponse<{ list: SaleOrder[]; total: number }>>('/api/sale-orders/list', {
      params,
    }),
  get: (id: number) => api.get<unknown, HttpResponse<SaleOrder>>(`/api/sale-orders/${id}`),
  create: (payload: SaleOrderPayload) =>
    api.post<unknown, HttpResponse<SaleOrder>>('/api/sale-orders', payload),
  update: (payload: SaleOrderPayload & { id: number }) =>
    api.put<unknown, HttpResponse<SaleOrder>>('/api/sale-orders', payload),
  remove: (id: number) => api.delete(`/api/sale-orders/${id}`),
}
