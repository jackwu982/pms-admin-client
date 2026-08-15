import api from './module/api'

export const categoryApi = {
  list: (params: Record<string, any>) => api.get('/api/categories/list', { params }),
  listAll: (params: Record<string, any>) => api.get('/api/categories/list-all', { params }),
  create: (obj: Record<string, any>) => api.post('/api/categories', obj),
  update: (obj: Record<string, any>) => api.put('/api/categories', obj),
}
