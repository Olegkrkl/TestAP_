import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { client } from '@/api/client'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'student' | 'teacher' | 'admin'
  avatar_url?: string
  is_active: boolean
  language: string
  dark_mode: boolean
  streak_days: number
  email_verified?: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

const stored = localStorage.getItem('auth')
const initial: AuthState = stored
  ? JSON.parse(stored)
  : { user: null, accessToken: null, refreshToken: null, loading: false, error: null }

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (creds: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/auth/login', creds)
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string; code?: string }
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return rejectWithValue(
          'Не вдалося підключитись до сервера. Зачекайте 30–60 сек (сервер прокидається) і спробуйте знову.'
        )
      }
      return rejectWithValue(err.response?.data?.detail || err.message || 'Login failed')
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (creds: { email: string; password: string; full_name: string; role: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/auth/register', creds)
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.detail || err.message || 'Registration failed')
    }
  }
)

export const refreshThunk = createAsyncThunk(
  'auth/refresh',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const res = await client.post('/auth/refresh', { refresh_token: refreshToken })
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.detail || err.message || 'Refresh failed')
    }
  }
)

export const googleLoginThunk = createAsyncThunk(
  'auth/google',
  async (data: { credential: string; role: string }, { rejectWithValue }) => {
    try {
      const res = await client.post('/auth/google', data)
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.detail || err.message || 'Google sign-in failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('auth')
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      localStorage.setItem('auth', JSON.stringify(state))
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.loading = true
      state.error = null
    }
    const handleFulfilled = (
      state: AuthState,
      action: PayloadAction<{ access_token: string; refresh_token: string; user: User }>
    ) => {
      state.loading = false
      state.accessToken = action.payload.access_token
      state.refreshToken = action.payload.refresh_token
      state.user = action.payload.user
      localStorage.setItem('auth', JSON.stringify(state))
    }
    const handleRejected = (state: AuthState, action: { payload?: unknown }) => {
      state.loading = false
      state.error = (action.payload as string) || 'Authentication failed'
    }
    builder
      .addCase(loginThunk.pending, handlePending)
      .addCase(loginThunk.fulfilled, handleFulfilled)
      .addCase(loginThunk.rejected, handleRejected)
      .addCase(registerThunk.pending, handlePending)
      .addCase(registerThunk.fulfilled, handleFulfilled)
      .addCase(registerThunk.rejected, handleRejected)
      .addCase(refreshThunk.pending, handlePending)
      .addCase(refreshThunk.fulfilled, handleFulfilled)
      .addCase(refreshThunk.rejected, handleRejected)
      .addCase(googleLoginThunk.pending, handlePending)
      .addCase(googleLoginThunk.fulfilled, handleFulfilled)
      .addCase(googleLoginThunk.rejected, handleRejected)
  },
})

export const { logout, setUser, clearError } = authSlice.actions
export default authSlice.reducer
