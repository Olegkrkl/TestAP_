import { client } from './client'

export const groupsApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await client.get('/groups', { params })
    return res.data
  },
  get: async (id: string) => {
    const res = await client.get(`/groups/${id}`)
    return res.data
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await client.post('/groups', data)
    return res.data
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await client.patch(`/groups/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    await client.delete(`/groups/${id}`)
  },
  join: async (inviteCode: string) => {
    const res = await client.post('/groups/join', { invite_code: inviteCode })
    return res.data
  },
  removeMember: async (groupId: string, userId: string) => {
    await client.delete(`/groups/${groupId}/members/${userId}`)
  },
  createAnnouncement: async (groupId: string, content: string) => {
    const res = await client.post(`/groups/${groupId}/announcements`, { content, group_id: groupId })
    return res.data
  },
  getAnnouncements: async (groupId: string) => {
    const res = await client.get(`/groups/${groupId}/announcements`)
    return res.data
  },
  importMembers: async (groupId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post(`/groups/${groupId}/import-members`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as {
      added: number
      created_accounts: number
      skipped: number
      errors: { row: number; email: string; error: string }[]
    }
  },
}
