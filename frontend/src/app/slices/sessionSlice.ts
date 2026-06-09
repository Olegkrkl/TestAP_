import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Session {
  id: string
  test_id: string
  user_id: string
  started_at: string
  answers: Record<string, unknown>
  flagged: string[]
  status: string
  violations: number
  completed_at?: string
}

export interface QuestionStat {
  question_id: string
  correct: boolean
  points_earned: number
  points_possible: number
  user_answer: unknown
  correct_answer: unknown
  question_content: string
  question_type: string
  hint_used: boolean
  explanation?: string
}

export interface TestResult {
  id: string
  session_id: string
  user_id: string
  test_id: string
  score: number
  max_score: number
  percent: number
  passed: boolean
  per_question_stats: QuestionStat[]
  completed_at: string
  violations: number
}

interface SessionState {
  activeSession: Session | null
  result: TestResult | null
  remainingSeconds: number | null
  totalSeconds: number | null
  loading: boolean
}

const initialState: SessionState = {
  activeSession: null,
  result: null,
  remainingSeconds: null,
  totalSeconds: null,
  loading: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      state.activeSession = action.payload
    },
    setResult(state, action: PayloadAction<TestResult | null>) {
      state.result = action.payload
    },
    setTimer(state, action: PayloadAction<{ remaining: number | null; total: number | null }>) {
      state.remainingSeconds = action.payload.remaining
      state.totalSeconds = action.payload.total
    },
    tickTimer(state) {
      if (state.remainingSeconds !== null && state.remainingSeconds > 0) {
        state.remainingSeconds -= 1
      }
    },
    updateAnswer(state, action: PayloadAction<{ questionId: string; answer: unknown }>) {
      if (state.activeSession) {
        state.activeSession.answers[action.payload.questionId] = action.payload.answer
      }
    },
    toggleFlag(state, action: PayloadAction<string>) {
      if (state.activeSession) {
        const flags = state.activeSession.flagged
        const idx = flags.indexOf(action.payload)
        if (idx === -1) {
          state.activeSession.flagged = [...flags, action.payload]
        } else {
          state.activeSession.flagged = flags.filter(f => f !== action.payload)
        }
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
  },
})

export const { setSession, setResult, setTimer, tickTimer, updateAnswer, toggleFlag, setLoading } = sessionSlice.actions
export default sessionSlice.reducer
