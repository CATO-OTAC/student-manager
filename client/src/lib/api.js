import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const studentsApi = {
  getAll: () => api.get('/students').then(r => r.data),
  create: (data) => api.post('/students', data).then(r => r.data),
  update: (id, data) => api.put(`/students/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/students/${id}`),
}

export const sessionsApi = {
  getByMonth: (month, year) =>
    api.get('/sessions', { params: { month, year } }).then(r => r.data),
  getByYear: (year) =>
    api.get('/sessions', { params: { year } }).then(r => r.data),
  bulkSave: (sessions) =>
    api.post('/sessions/bulk', { sessions }).then(r => r.data),
}

export const schedulesApi = {
  getAll: () => api.get('/schedules').then(r => r.data),
  getByStudent: (studentId) => api.get(`/schedules/${studentId}`).then(r => r.data),
  saveDefault: (studentId, schedule) =>
    api.post(`/schedules/${studentId}/default`, { schedule }).then(r => r.data),
  addChange: (studentId, data) =>
    api.post(`/schedules/${studentId}/changes`, data).then(r => r.data),
  deleteChange: (id) => api.delete(`/schedules/change/${id}`),
}
