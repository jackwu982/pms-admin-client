import api, { type HttpResponse } from './module/api'
import type { WorkHourRow } from '@/types/workHourStatistics'
export const workHourStatisticsApi = {
  listPage: (params: { startDate?: string; endDate?: string; pageNum: number; pageSize: number }) =>
    api.get<unknown, HttpResponse<{ list: WorkHourRow[]; total: number }>>(
      '/api/work-hour-statistics/list-page',
      { params }
    ),
  list: (params: { startDate?: string; endDate?: string }) =>
    api.get<unknown, HttpResponse<WorkHourRow[]>>('/api/work-hour-statistics/list', { params }),
}
