import api from './module/api'

export const processApi = {
  listAll: (params: Record<string, any>) => api.get('/api/processes/list-all', { params }),
  create: (obj: Record<string, any>) => api.post('/api/processes', obj),
  update: (obj: Record<string, any>) => api.put('/api/processes', obj),
  delete: (id: string) => api.delete(`/api/processes/${id}`),

  getByManager: () => api.get('/api/processes/by-manager'),
}
