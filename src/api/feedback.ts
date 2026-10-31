import api from './module/api'
export const feedbackApi = {
  respond: (id: number, data: { feedbackStatus: number; feedbackOpinion: string }) =>
    api.put(`/api/feedback/${id}/response`, data),
  list: (params: Record<string, unknown>) => api.get('/api/feedback/list', { params }),
}
