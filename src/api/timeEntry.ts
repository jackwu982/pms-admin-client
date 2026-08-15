import api from './module/api'

export const timeEntryApi = {
  list: (params: Record<string, any>) => api.get('/api/time-entries/list', { params }),
  listAll: (params: Record<string, any>) => api.get('/api/time-entries/list-all', { params }),
}
