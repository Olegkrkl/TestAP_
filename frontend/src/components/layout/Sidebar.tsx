import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { logout } from '@/app/slices/authSlice'
import { setSidebarOpen } from '@/app/slices/uiSlice'
import { statsApi } from '@/api/usersApi'
import {
  GraduationCap, LayoutDashboard, BookOpen, History,
  FlaskConical, User, Users, BarChart2, ShieldCheck, X, LogOut,
  CalendarDays,
} from 'lucide-react'

const navItems = {
  student: [
    { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/tests', label: 'nav.tests', icon: BookOpen },
    { to: '/history', label: 'nav.history', icon: History },
    { to: '/calendar', label: 'nav.calendar', icon: CalendarDays },
    { to: '/my-tests', label: 'nav.myTests', icon: FlaskConical },
    { to: '/profile', label: 'nav.profile', icon: User },
  ],
  teacher: [
    { to: '/teacher/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/teacher/tests', label: 'nav.tests', icon: BookOpen },
    { to: '/teacher/groups', label: 'nav.groups', icon: Users },
    { to: '/profile', label: 'nav.profile', icon: User },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'nav.users', icon: Users },
    { to: '/admin/groups', label: 'nav.groups', icon: ShieldCheck },
  ],
}

interface Props {
  role: 'student' | 'teacher' | 'admin'
}

function getNextStreakMilestone(streak: number): number | null {
  if (streak < 7) return 7
  if (streak < 30) return 30
  return null
}

export default function Sidebar({ role }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const sidebarOpen = useAppSelector(s => s.ui.sidebarOpen)
  const [streakDays, setStreakDays] = useState(user?.streak_days ?? 0)

  useEffect(() => {
    if (role === 'student' && user) {
      statsApi.student().then(s => {
        if (s.streak_days != null) setStreakDays(s.streak_days)
      }).catch(() => {})
    }
  }, [role, user])

  const items = navItems[role]
  const nextMilestone = getNextStreakMilestone(streakDays)
  const streakProgress = nextMilestone ? Math.min(100, (streakDays / nextMilestone) * 100) : 100

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      <aside
        className={`sidebar-aside fixed top-0 left-0 h-full w-[260px] z-30 flex flex-col transition-transform duration-300
          bg-[#0f0a1e] border-r border-white/[0.06]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">TestAP</span>
          </div>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 shrink-0"
                style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #9333ea 100%)' }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-xs text-white/40 capitalize">{t(`auth.${user.role}`)}</p>
              </div>
            </div>
            {role === 'student' && streakDays > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                  <span>🔥 {streakDays} днів</span>
                  {nextMilestone && <span>{nextMilestone} дн.</span>}
                </div>
                <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${streakProgress}%`,
                      background: 'linear-gradient(90deg, #f97316, #ef4444)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => window.innerWidth < 1024 && dispatch(setSidebarOpen(false))}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t(label)}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-white/30 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
