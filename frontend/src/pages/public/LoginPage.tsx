import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { loginThunk, clearError } from '@/app/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GoogleButton from '@/components/auth/GoogleButton'

const schema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(1, 'Введіть пароль'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(loginThunk(data))
    if (loginThunk.fulfilled.match(result)) {
      const user = result.payload.user
      navigate(user.role === 'student' ? '/dashboard' : `/${user.role}/dashboard`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('auth.login')}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Раді бачити вас знову!</p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <GoogleButton label="Увійти через Google" />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">або</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" {...register('email')} className="input" placeholder="name@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">{t('auth.password')}</label>
            <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">{t('auth.forgotPassword')}</Link>
          </div>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} {...register('password')} className="input pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
          {loading ? 'Завантаження...' : t('auth.loginBtn')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">{t('auth.registerBtn')}</Link>
      </p>
    </div>
  )
}
