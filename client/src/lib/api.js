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

export const schoolApi = {
  getTimetable: () => api.get('/school/timetable').then(r => r.data),
  addSlot: (data) => api.post('/school/timetable', data).then(r => r.data),
  updateSlot: (id, data) => api.put(`/school/timetable/${id}`, data).then(r => r.data),
  deleteSlot: (id) => api.delete(`/school/timetable/${id}`),

  getHomework: () => api.get('/school/homework').then(r => r.data),
  addHomework: (data) => api.post('/school/homework', data).then(r => r.data),
  updateHomework: (id, data) => api.put(`/school/homework/${id}`, data).then(r => r.data),
  deleteHomework: (id) => api.delete(`/school/homework/${id}`),
  toggleDone: (id, done) => api.put(`/school/homework/${id}`, { done }).then(r => r.data),

  getExams: () => api.get('/school/exams').then(r => r.data),
  addExam: (data) => api.post('/school/exams', data).then(r => r.data),
  updateExam: (id, data) => api.put(`/school/exams/${id}`, data).then(r => r.data),
  deleteExam: (id) => api.delete(`/school/exams/${id}`),
}
