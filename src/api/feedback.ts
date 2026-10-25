import api from './module/api'
export const feedbackApi = {
  list: (params: Record<string, unknown>) => api.get('/api/feedback/list', { params }),
}
