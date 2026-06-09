import { Outlet, Link, Navigate } from 'react-router-dom'
import { GraduationCap, CheckCircle } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'

const features = [
  '7 типів питань з drag & drop',
  'Серверний таймер — надійний захист',
  'Аналітика та гейміфікація',
]

export default function AuthLayout() {
  const { user } = useAppSelector(s => s.auth)

  if (user) {
    const dest = user.role === 'student' ? '/dashboard' : `/${user.role}/dashboard`
    return <Navigate to={dest} replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #1e1b4b 100%)' }}>

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/4 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.18) 0%, transparent 70%)', animation: 'float 9s ease-in-out infinite reverse' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', animation: 'float 7s ease-in-out infinite 2s' }} />

        <div className="relative text-center text-white max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-7 flex items-center justify-center ring-1 ring-white/20"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl font-display font-bold mb-3 leading-tight">
            Розумне<br />тестування
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-10">
            Платформа для ефективного навчання та перевірки знань
          </p>

          <div className="flex flex-col gap-3 items-center">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2.5 rounded-full px-4 py-2 text-sm text-white/80"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0a0812]">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #9333ea)' }}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gray-900 dark:text-white">TestAP</span>
        </Link>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
