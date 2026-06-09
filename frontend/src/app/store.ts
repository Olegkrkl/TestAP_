import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import testsReducer from './slices/testsSlice'
import sessionReducer from './slices/sessionSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tests: testsReducer,
    session: sessionReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
