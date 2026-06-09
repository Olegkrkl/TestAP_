import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Mail } from 'lucide-react'
import { authApi } from '@/api/authApi'
import Spinner from '@/components/ui/Spinner'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle')
  const [message, setMessage] = useState<string>('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then(() => {
        setStatus('success')
        setMessage('Email успішно підтверджено. Тепер можете користуватися всіма функціями TestAP.')
      })
      .catch((e: Error) => {
        setStatus('error')
        setMessage(e.message || 'Не вдалося підтвердити email. Можливо, посилання застаріло.')
      })
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return
    try {
      await authApi.resendVerification(resendEmail)
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Підтверджуємо email...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email підтверджено!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <Link to="/login" className="btn-primary inline-flex">Увійти</Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Помилка підтвердження</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <form onSubmit={handleResend} className="space-y-3 max-w-xs mx-auto">
            <input
              type="email"
              required
              placeholder="Ваш email"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn-primary w-full">Надіслати новий лист</button>
            {resendStatus === 'sent' && (
              <p className="text-emerald-600 text-sm">Якщо акаунт існує — лист надіслано.</p>
            )}
            {resendStatus === 'error' && (
              <p className="text-rose-500 text-sm">Не вдалося надіслати. Спробуйте ще раз.</p>
            )}
          </form>
        </>
      )}

      {status === 'idle' && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Підтвердження email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Введіть email, на який було надіслано лист, щоб отримати нове посилання для підтвердження.
          </p>
          <form onSubmit={handleResend} className="space-y-3 max-w-xs mx-auto">
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn-primary w-full">Надіслати лист</button>
            {resendStatus === 'sent' && (
              <p className="text-emerald-600 text-sm">Якщо акаунт існує — лист надіслано.</p>
            )}
          </form>
        </>
      )}
    </div>
  )
}
