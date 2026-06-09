import { client, downloadAuthed } from './client'

export const testsApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await client.get('/tests', { params })
    return res.data
  },
  get: async (id: string) => {
    const res = await client.get(`/tests/${id}`)
    return res.data
  },
  create: async (data: Record<string, unknown>) => {
    const res = await client.post('/tests', data)
    return res.data
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const res = await client.patch(`/tests/${id}`, data)
    return res.data
  },
  delete: async (id: string) => {
    await client.delete(`/tests/${id}`)
  },
  publish: async (id: string) => {
    const res = await client.post(`/tests/${id}/publish`)
    return res.data
  },
  archive: async (id: string) => {
    const res = await client.post(`/tests/${id}/archive`)
    return res.data
  },
  copy: async (id: string) => {
    const res = await client.post(`/tests/${id}/copy`)
    return res.data
  },
  addQuestion: async (testId: string, data: Record<string, unknown>) => {
    const res = await client.post(`/tests/${testId}/questions`, data)
    return res.data
  },
  updateQuestion: async (testId: string, questionId: string, data: Record<string, unknown>) => {
    const res = await client.patch(`/tests/${testId}/questions/${questionId}`, data)
    return res.data
  },
  deleteQuestion: async (testId: string, questionId: string) => {
    await client.delete(`/tests/${testId}/questions/${questionId}`)
  },
  importQuestions: async (testId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post(`/import-export/tests/${testId}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  parseFile: async (file: File): Promise<ParsedFileResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post('/import-export/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as ParsedFileResult
  },
  exportPdf: async (testId: string, title?: string) => {
    const safe = (title || `test-${testId.slice(0, 8)}`).replace(/[^\w\s-]/g, '').trim()
    await downloadAuthed(`/import-export/tests/${testId}/export/pdf`, `${safe}.pdf`)
  },
  exportResultsXlsx: async (testId: string) => {
    await downloadAuthed(`/import-export/tests/${testId}/results/export/xlsx`, `results-${testId.slice(0, 8)}.xlsx`)
  },
  calendar: async () => {
    const res = await client.get('/tests/calendar')
    return res.data
  },
  preview: async (id: string): Promise<TestPreview> => {
    const res = await client.get(`/tests/${id}/preview`)
    return res.data
  },
}

export interface ParsedQuestion {
  type?: string
  content?: string
  hint?: string | null
  explanation?: string | null
  points?: number
  options?: Record<string, unknown>
  needs_review?: boolean
}

export interface ParsedFileResult {
  count: number
  questions: ParsedQuestion[]
}

export interface TestPreview {
  id: string
  title: string
  description?: string | null
  category?: string | null
  tags?: string[]
  question_count: number
  total_points: number
  time_limit?: number | null
  per_question_timer: boolean
  attempts_allowed: number
  attempts_used: number
  attempts_unlimited: boolean
  passing_score: number
  shuffle_questions: boolean
  shuffle_answers: boolean
  show_answers_after: boolean
  copy_protection: boolean
  tab_switch_detection: boolean
  opens_at?: string | null
  closes_at?: string | null
  is_training: boolean
  status: string
  is_open: boolean
  has_in_progress_session: boolean
  in_progress_session_id?: string | null
  best_percent?: number | null
}
