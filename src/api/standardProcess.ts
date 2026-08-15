import api from './module/api'

export const standardProcessApi = {
  list: (params: Record<string, any>) => api.get('/api/standard-processes/list', { params }),
  create: (obj: Record<string, any>) => api.post('/api/standard-processes', obj),
  update: (obj: Record<string, any>) => api.put('/api/standard-processes', obj),
  delete: (id: string) => api.delete(`/api/standard-processes/${id}`),
}
