import { client, downloadAuthed } from './client'

export const usersApi = {
  me: async () => {
    const res = await client.get('/users/me')
    return res.data
  },
  updateMe: async (data: Record<string, unknown>) => {
    const res = await client.patch('/users/me', data)
    return res.data
  },
  myStats: async () => {
    const res = await client.get('/users/me/stats')
    return res.data
  },
  myBadges: async () => {
    const res = await client.get('/users/me/badges')
    return res.data
  },
  list: async (params?: Record<string, unknown>) => {
    const res = await client.get('/users', { params })
    return res.data
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await client.patch(`/users/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    await client.delete(`/users/${id}`)
  },
}

export const notificationsApi = {
  list: async () => {
    const res = await client.get('/notifications')
    return res.data
  },
  markAllRead: async () => {
    await client.post('/notifications/mark-read')
  },
  markRead: async (id: string) => {
    await client.patch(`/notifications/${id}/read`)
  },
}

export const statsApi = {
  student: async () => {
    const res = await client.get('/stats/student')
    return res.data
  },
  teacher: async () => {
    const res = await client.get('/stats/teacher')
    return res.data
  },
  admin: async () => {
    const res = await client.get('/stats/admin')
    return res.data
  },
}

export const resultsApi = {
  my: async (params?: Record<string, unknown>) => {
    const res = await client.get('/results/my', { params })
    return res.data
  },
  forTest: async (testId: string) => {
    const res = await client.get(`/results/test/${testId}`)
    return res.data
  },
  analytics: async (testId: string) => {
    const res = await client.get(`/results/test/${testId}/analytics`)
    return res.data
  },
  get: async (id: string) => {
    const res = await client.get(`/results/${id}`)
    return res.data
  },
  latestForTest: async (testId: string) => {
    const res = await client.get(`/results/test/${testId}/latest`)
    return res.data
  },
  downloadCertificate: async (resultId: string) => {
    await downloadAuthed(`/import-export/results/${resultId}/certificate.pdf`, `certificate-${resultId.slice(0, 8)}.pdf`)
  },
}

export const commentsApi = {
  list: async (testId: string) => {
    const res = await client.get(`/comments/tests/${testId}`)
    return res.data
  },
  create: async (testId: string, content: string) => {
    const res = await client.post(`/comments/tests/${testId}`, { content })
    return res.data
  },
}
