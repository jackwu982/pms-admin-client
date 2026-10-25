import api from './module/api'
import type { RepairOrder } from '@/types/repairOrder'
export const repairOrderApi = {
  list: (params: Record<string, unknown>) => api.get('/api/repair-orders/list', { params }),
  create: (data: RepairOrder) => api.post('/api/repair-orders', data),
  update: (data: RepairOrder) => api.put('/api/repair-orders', data),
}
