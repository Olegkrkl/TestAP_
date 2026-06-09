import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { googleLoginThunk } from '@/app/slices/authSlice'
import { authApi } from '@/api/authApi'

interface Props {
  label?: string
  role?: 'student' | 'teacher'
}

// Google Identity Services renders its own button inside our container.
// We trigger our backend (/auth/google) with the returned id_token.
export default function GoogleButton({ label, role }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [clientId, setClientId] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const roleRef = useRef(role)

  // Keep latest role available to the callback, which Google fires async.
  useEffect(() => { roleRef.current = role }, [role])

  useEffect(() => {
    let cancelled = false
    authApi.googleConfig().then(cfg => {
      if (cancelled) return
      if (cfg?.enabled && cfg?.client_id) setClientId(cfg.client_id)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!clientId) return
    // Load the GIS script once.
    const existing = document.getElementById('google-identity') as HTMLScriptElement | null
    if (existing) {
      if ((window as any).google?.accounts?.id) setScriptReady(true)
      else existing.addEventListener('load', () => setScriptReady(true), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.id = 'google-identity'
    s.onload = () => setScriptReady(true)
    document.head.appendChild(s)
  }, [clientId])

  useEffect(() => {
    if (!clientId || !scriptReady || !containerRef.current) return
    const g = (window as any).google
    if (!g?.accounts?.id) return

    g.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        const result = await dispatch(googleLoginThunk({
          credential: resp.credential,
          role: roleRef.current ?? 'student',
        }))
        if (googleLoginThunk.fulfilled.match(result)) {
          const user = result.payload.user
          navigate(user.role === 'student' ? '/dashboard' : `/${user.role}/dashboard`)
        }
      },
    })

    containerRef.current.innerHTML = ''
    g.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      width: containerRef.current.offsetWidth || 320,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
    })
  }, [clientId, scriptReady, dispatch, navigate])

  if (!clientId) return null

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full flex justify-center" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}
