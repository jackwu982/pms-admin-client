import api, { type HttpResponse } from './module/api'
import type { WorkHourRow } from '@/types/workHourStatistics'
export const workHourStatisticsApi = {
  list: (params: { startDate?: string; endDate?: string }) =>
    api.get<unknown, HttpResponse<WorkHourRow[]>>('/api/work-hour-statistics/list', { params }),
}
