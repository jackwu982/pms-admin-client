import api from './module/api'

export const userApi = {
  login: (username: string, password: string) =>
    api.get('/api/users/login', { params: { username, password } }),
  logout: () => api.get('/api/users/logout'),

  list: (params: Record<string, any>) => api.get('/api/users/list', { params }),
  create: (obj: Record<string, any>) => api.post('/api/users', obj),
  update: (obj: Record<string, any>) => api.put('/api/users', obj),
  delete: (id: string) => api.delete(`/api/users/${id}`),
}
