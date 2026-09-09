import api from './module/api'

export const subTaskApi = {
  create: (obj: Record<string, any>) => api.post('/api/sub-tasks', obj),
  update: (obj: Record<string, any>) => api.put('/api/sub-tasks', obj),
}
