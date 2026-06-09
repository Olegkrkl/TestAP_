import { client } from './client'

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await client.post('/auth/login', data)
    return res.data
  },
  register: async (data: { email: string; password: string; full_name: string; role: string }) => {
    const res = await client.post('/auth/register', data)
    return res.data
  },
  refresh: async (refreshToken: string) => {
    const res = await client.post('/auth/refresh', { refresh_token: refreshToken })
    return res.data
  },
  me: async () => {
    const res = await client.get('/auth/me')
    return res.data
  },
  changePassword: async (data: { current_password: string; new_password: string }) => {
    const res = await client.post('/auth/change-password', data)
    return res.data
  },
  forgotPassword: async (email: string) => {
    const res = await client.post('/auth/forgot-password', { email })
    return res.data
  },
  googleConfig: async (): Promise<{ enabled: boolean; client_id: string }> => {
    const res = await client.get('/auth/google/config')
    return res.data
  },
  googleLogin: async (data: { credential: string; role: string }) => {
    const res = await client.post('/auth/google', data)
    return res.data
  },
  verifyEmail: async (token: string) => {
    const res = await client.post('/auth/verify-email', { token })
    return res.data
  },
  resendVerification: async (email: string) => {
    const res = await client.post('/auth/resend-verification', { email })
    return res.data
  },
}
