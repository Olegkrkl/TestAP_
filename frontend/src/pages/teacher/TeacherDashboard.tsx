import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, CheckCircle, Activity, Plus, ArrowRight } from 'lucide-react'
import { statsApi } from '@/api/usersApi'
import { testsApi } from '@/api/testsApi'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentTests, setRecentTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([statsApi.teacher(), testsApi.list({ limit: 5 })]).then(([s, t]) => {
      setStats(s)
      setRecentTests(t)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Панель викладача</h1>
        <Link to="/teacher/tests/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Новий тест
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Всього тестів" value={stats?.total_tests || 0} icon={BookOpen} color="primary" />
        <StatCard title="Студентів" value={stats?.total_students || 0} icon={Users} color="blue" />
        <StatCard title="Груп" value={stats?.total_groups || 0} icon={Users} color="green" />
        <StatCard title="Спроб за тиждень" value={stats?.recent_submissions || 0} icon={Activity} color="yellow" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Останні тести</h2>
          <Link to="/teacher/tests" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
            Всі <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentTests.map(test => (
            <div key={test.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{test.title}</p>
                  <p className="text-xs text-gray-400">{test.question_count} питань</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={test.status === 'published' ? 'success' : test.status === 'draft' ? 'gray' : 'warning'}>
                  {test.status === 'published' ? 'Опубліковано' : test.status === 'draft' ? 'Чернетка' : 'Архів'}
                </Badge>
                <Link to={`/teacher/tests/${test.id}/edit`} className="btn-ghost text-xs py-1 px-2">Ред.</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
