import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function getAuthState() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return { accessToken: null, refreshToken: null }
    return JSON.parse(raw) as { accessToken: string | null; refreshToken: string | null }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

function saveTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('auth')
    const current = raw ? JSON.parse(raw) : {}
    localStorage.setItem('auth', JSON.stringify({ ...current, accessToken, refreshToken }))
  } catch {}
}

function clearAuth() {
  localStorage.removeItem('auth')
}

client.interceptors.request.use((config) => {
  const { accessToken } = getAuthState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken } = getAuthState()
      if (!refreshToken) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }
      isRefreshing = true
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        const { access_token, refresh_token } = res.data
        saveTokens(access_token, refresh_token)
        failedQueue.forEach(({ resolve }) => resolve(access_token))
        failedQueue = []
        original.headers.Authorization = `Bearer ${access_token}`
        return client(original)
      } catch {
        failedQueue.forEach(({ reject }) => reject(error))
        failedQueue = []
        clearAuth()
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    const message = error.response?.data?.detail || error.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

/**
 * Download an authenticated binary response (PDF/XLSX) and trigger a save.
 * Plain <a href> doesn't carry the Authorization header, so we fetch via the
 * auth-injected axios client and turn the blob into an object URL.
 */
export async function downloadAuthed(path: string, filename: string): Promise<void> {
  const res = await client.get(path, { responseType: 'blob' })
  const url = window.URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => window.URL.revokeObjectURL(url), 0)
}
