import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Question {
  id: string
  test_id: string
  type: string
  content: string
  hint?: string
  explanation?: string
  points: number
  order_index: number
  time_limit?: number
  options: Record<string, unknown>
}

export interface Test {
  id: string
  title: string
  description?: string
  author_id: string
  group_id?: string
  time_limit?: number
  per_question_timer: boolean
  attempts_allowed: number
  shuffle_questions: boolean
  shuffle_answers: boolean
  show_answers_after: boolean
  passing_score: number
  opens_at?: string
  closes_at?: string
  copy_protection: boolean
  tab_switch_detection: boolean
  status: string
  is_training: boolean
  tags: string[]
  category?: string
  question_count: number
  created_at: string
  updated_at: string
  questions?: Question[]
}

interface TestsState {
  list: Test[]
  activeTest: Test | null
  loading: boolean
  error: string | null
}

const initialState: TestsState = {
  list: [],
  activeTest: null,
  loading: false,
  error: null,
}

const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    setTests(state, action: PayloadAction<Test[]>) {
      state.list = action.payload
    },
    setActiveTest(state, action: PayloadAction<Test | null>) {
      state.activeTest = action.payload
    },
    addTest(state, action: PayloadAction<Test>) {
      state.list.unshift(action.payload)
    },
    updateTest(state, action: PayloadAction<Test>) {
      const idx = state.list.findIndex(t => t.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    removeTest(state, action: PayloadAction<string>) {
      state.list = state.list.filter(t => t.id !== action.payload)
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setTests, setActiveTest, addTest, updateTest, removeTest, setLoading, setError } = testsSlice.actions
export default testsSlice.reducer
