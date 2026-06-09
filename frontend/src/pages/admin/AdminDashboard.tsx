import { useEffect, useState } from 'react'
import { Users, BookOpen, Users2, Activity } from 'lucide-react'
import { statsApi } from '@/api/usersApi'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.admin().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Панель адміністратора</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Користувачів" value={stats?.total_users || 0} icon={Users} color="primary" />
        <StatCard title="Тестів" value={stats?.total_tests || 0} icon={BookOpen} color="blue" />
        <StatCard title="Груп" value={stats?.total_groups || 0} icon={Users2} color="green" />
        <StatCard title="Активних сесій" value={stats?.active_sessions || 0} icon={Activity} color="yellow" />
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">Швидкі дії</h2>
        <div className="flex gap-3 flex-wrap">
          <a href="/admin/users" className="btn-primary">Управління користувачами</a>
          <a href="/admin/groups" className="btn-secondary">Перегляд груп</a>
        </div>
      </div>
    </div>
  )
}
