import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle, TrendingUp, Flame, Award, Clock, ArrowRight } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { statsApi, resultsApi } from '@/api/usersApi'
import { testsApi } from '@/api/testsApi'
import StatCard from '@/components/ui/StatCard'
import { SkeletonDashboard } from '@/components/ui/SkeletonCard'
import Badge from '@/components/ui/Badge'
import UpcomingDeadlines from '@/components/student/UpcomingDeadlines'

export default function StudentDashboard() {
  const { user } = useAppSelector(s => s.auth)
  const [stats, setStats] = useState<any>(null)
  const [assignedTests, setAssignedTests] = useState<any[]>([])
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.student(),
      testsApi.list({ status: 'published', limit: 5 }),
      resultsApi.my({ limit: 5 }),
    ]).then(([s, t, r]) => {
      setStats(s)
      setAssignedTests(t)
      setRecentResults(r)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonDashboard />

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          Вітаємо, {user?.full_name.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Продовжуйте навчання — ви на правильному шляху</p>
      </div>

      {/* Streak banner */}
      {stats?.streak_days > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ef4444 60%, #e11d48 100%)',
            boxShadow: '0 8px 32px rgba(239,68,68,0.35)',
          }}>
          <div className="absolute right-4 top-0 text-[80px] leading-none opacity-10 select-none pointer-events-none">🔥</div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-xl">{stats.streak_days} днів поспіль!</p>
              <p className="text-white/75 text-sm mt-0.5">Продовжуйте у тому ж дусі — ви молодець!</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Тестів пройдено" value={stats?.tests_completed || 0} icon={CheckCircle} color="green" />
        <StatCard title="Середній бал" value={`${stats?.average_score || 0}%`} icon={TrendingUp} color="primary" />
        <StatCard title="Активних тестів" value={stats?.active_tests || 0} icon={Clock} color="yellow" />
        <StatCard title="Бейджів" value={stats?.badges_count || 0} icon={Award} color="blue" />
      </div>

      <UpcomingDeadlines />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned tests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white">Доступні тести</h2>
            <Link to="/tests" className="text-primary-600 dark:text-primary-400 text-sm flex items-center gap-1 hover:underline">
              Всі <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {assignedTests.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Немає доступних тестів</p>
          ) : (
            <div className="space-y-2">
              {assignedTests.map(test => (
                <Link key={test.id} to={`/test/${test.id}/preview`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{test.title}</p>
                      <p className="text-xs text-gray-400">{test.question_count} питань</p>
                    </div>
                  </div>
                  {test.closes_at && (
                    <Badge variant="warning">{new Date(test.closes_at).toLocaleDateString('uk-UA')}</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white">Останні результати</h2>
            <Link to="/history" className="text-primary-600 dark:text-primary-400 text-sm flex items-center gap-1 hover:underline">
              Все <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Ще не проходили тестів</p>
          ) : (
            <div className="space-y-2">
              {recentResults.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04]">
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{r.test_id}</p>
                    <p className="text-xs text-gray-400">{new Date(r.completed_at).toLocaleDateString('uk-UA')}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold ${r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{r.percent}%</p>
                    <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'Пройдено' : 'Не пройдено'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
