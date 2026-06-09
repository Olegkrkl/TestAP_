import { Outlet, Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'

export default function PublicLayout() {
  const { user } = useAppSelector(s => s.auth)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">TestAP</span>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                to={user.role === 'student' ? '/dashboard' : `/${user.role}/dashboard`}
                className="btn-primary"
              >
                Перейти до платформи
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Вхід</Link>
                <Link to="/register" className="btn-primary">Реєстрація</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
