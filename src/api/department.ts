import api from './module/api'

export const departmentApi = {
  listAll: (params: Record<string, any>) => api.get('/api/departments/list-all', { params }),
  create: (obj: Record<string, any>) => api.post('/api/departments', obj),
  update: (obj: Record<string, any>) => api.put('/api/departments', obj),
  list: (params: Record<string, any>) => api.get('/api/departments/list', { params }),
}
