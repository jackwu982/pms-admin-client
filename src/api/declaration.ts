import api from './module/api'

export const declarationApi = {
  list: (params: Record<string, any>) => api.get('/api/declarations/list', { params }),
  approve: (id: number | string) => api.post(`/api/declarations/${id}/approve`),
  reject: (id: number | string, reason: string) =>
    api.post(`/api/declarations/${id}/reject`, { rejectReason: reason }),
}
