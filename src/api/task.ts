import api from './module/api'

export const taskApi = {
  copy: (id: number, name: string) => api.post(`/api/tasks/${id}/copy`, { name }),
  update: (obj: Record<string, any>) => api.put('/api/tasks', obj),
  create: (obj: Record<string, any>) => api.post('/api/tasks', obj),
  searchAll: () => api.get('/api/tasks/search-all'),
  listAll: (params: Record<string, any>) => api.get('/api/tasks/list-all', { params }),
  list: (params: Record<string, any>) => api.get('/api/tasks/list', { params }),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),

  getByDepartment: () => api.get('/api/tasks/by-department'),
  getByManager: () => api.get('/api/tasks/by-manager'),
}
