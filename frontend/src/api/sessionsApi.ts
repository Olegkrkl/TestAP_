import { client } from './client'

export const sessionsApi = {
  start: async (testId: string) => {
    const res = await client.post('/sessions/start', { test_id: testId })
    return res.data
  },
  get: async (sessionId: string) => {
    const res = await client.get(`/sessions/${sessionId}`)
    return res.data
  },
  getRemaining: async (sessionId: string) => {
    const res = await client.get(`/sessions/${sessionId}/remaining`)
    return res.data
  },
  saveAnswer: async (sessionId: string, questionId: string, answer: unknown) => {
    const res = await client.patch(`/sessions/${sessionId}/answers`, { question_id: questionId, answer })
    return res.data
  },
  flagQuestion: async (sessionId: string, questionId: string) => {
    const res = await client.patch(`/sessions/${sessionId}/flag`, { question_id: questionId })
    return res.data
  },
  reportViolation: async (sessionId: string, type: string) => {
    const res = await client.post(`/sessions/${sessionId}/violation`, { type })
    return res.data
  },
  useHint: async (sessionId: string, questionId: string) => {
    const res = await client.post(`/sessions/${sessionId}/hint/${questionId}`)
    return res.data
  },
  submit: async (sessionId: string) => {
    const res = await client.post(`/sessions/${sessionId}/submit`)
    return res.data
  },
  getResult: async (sessionId: string) => {
    const res = await client.get(`/sessions/${sessionId}/result`)
    return res.data
  },
}
