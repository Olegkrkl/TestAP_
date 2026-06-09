import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  language: 'uk' | 'en'
  unreadNotifications: number
}

const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
const storedLang = (localStorage.getItem('language') as 'uk' | 'en') || 'uk'

// Sidebar starts collapsed on mobile/tablet to avoid hiding the main content
// behind a 260px-wide overlay on narrow screens.
const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

const initialState: UIState = {
  sidebarOpen: isDesktop,
  theme: storedTheme,
  language: storedLang,
  unreadNotifications: 0,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    },
    setLanguage(state, action: PayloadAction<'uk' | 'en'>) {
      state.language = action.payload
      localStorage.setItem('language', action.payload)
    },
    setUnreadNotifications(state, action: PayloadAction<number>) {
      state.unreadNotifications = action.payload
    },
  },
})

export const { toggleSidebar, setSidebarOpen, toggleTheme, setLanguage, setUnreadNotifications } = uiSlice.actions
export default uiSlice.reducer
