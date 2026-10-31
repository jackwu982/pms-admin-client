import api, { type HttpResponse } from './module/api'
import type { Product, Part, Operation } from '@/types/productType'

type WritePayload<T> = Omit<T, 'id' | 'parts' | 'operations'> & { id?: number }
interface Page<T> {
  list: T[]
  total: number
}

function catalogApi<T>(resource: string) {
  return {
    list: (params: Record<string, unknown>) =>
      api.get<unknown, HttpResponse<Page<T>>>(`/api/${resource}/list`, { params }),
    get: (id: number) => api.get<unknown, HttpResponse<T>>(`/api/${resource}/${id}`),
    create: (payload: WritePayload<T>) =>
      api.post<unknown, HttpResponse<T>>(`/api/${resource}`, payload),
    update: (payload: WritePayload<T> & { id: number }) =>
      api.put<unknown, HttpResponse<T>>(`/api/${resource}`, payload),
  }
}

export const productApi = {
  ...catalogApi<Product>('products'),
  copy: (id: number) => api.post<unknown, HttpResponse<Product>>(`/api/products/${id}/copy`),
  remove: (id: number) => api.delete(`/api/products/${id}`),
}
export const partApi = catalogApi<Part>('parts')
export const operationApi = catalogApi<Operation>('operations')
