import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { registerThunk, clearError } from '@/app/slices/authSlice'
import { Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GoogleButton from '@/components/auth/GoogleButton'

const schema = z.object({
  full_name: z.string().min(2, "Мінімум 2 символи"),
  email: z.string().email('Невірний формат email'),
  password: z.string().min(6, 'Мінімум 6 символів'),
  role: z.enum(['student', 'teacher']),
})

type FormData = z.infer<typeof schema>

const roles = [
  { value: 'student', label: 'Студент', icon: GraduationCap, desc: 'Проходжу тести та навчаюся' },
  { value: 'teacher', label: 'Викладач', icon: BookOpen, desc: 'Створюю тести та навчаю' },
]

export default function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(registerThunk(data))
    if (registerThunk.fulfilled.match(result)) {
      const user = result.payload.user
      navigate(user.role === 'student' ? '/dashboard' : `/${user.role}/dashboard`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('auth.register')}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Створіть акаунт безкоштовно</p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <GoogleButton label="Зареєструватися через Google" role={watch('role')} />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">або</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="label">{t('auth.role')}</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value as FormData['role'])}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${selectedRole === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${selectedRole === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${selectedRole === value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t('auth.fullName')}</label>
          <input type="text" {...register('full_name')} className="input" placeholder="Іванченко Іван Іванович" />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" {...register('email')} className="input" placeholder="name@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} {...register('password')} className="input pr-10" placeholder="Мінімум 6 символів" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
          {loading ? 'Завантаження...' : t('auth.registerBtn')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('auth.loginBtn')}</Link>
      </p>
    </div>
  )
}
