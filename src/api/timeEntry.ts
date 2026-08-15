import api from './module/api'

export const timeEntryApi = {
  listAll: (params: Record<string, any>) => api.get('/api/time-entries/list-all', { params }),
}
