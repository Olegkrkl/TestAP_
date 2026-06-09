import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

interface Props {
  role?: 'student' | 'teacher' | 'admin'
}

export default function ProtectedRoute({ role }: Props) {
  const { user } = useAppSelector(s => s.auth)

  if (!user) return <Navigate to="/login" replace />

  if (role) {
    // Admin can access everything
    if (user.role === 'admin') return <Outlet />
    // Teacher can access teacher routes
    if (role === 'teacher' && user.role !== 'teacher') {
      return <Navigate to={`/${user.role}/dashboard`} replace />
    }
    if (role === 'student' && user.role !== 'student') {
      return <Navigate to={`/${user.role}/dashboard`} replace />
    }
  }

  return <Outlet />
}
