import api from './module/api'
import type { Equipment } from '@/types/support'
export const equipmentApi = {
  maintain: (id: number) => api.post(`/api/equipment/${id}/maintain`),
  list: (params: Record<string, unknown>) => api.get('/api/equipment/list', { params }),
  create: (data: Equipment) => api.post('/api/equipment', data),
  update: (data: Equipment) => api.put('/api/equipment', data),
}
