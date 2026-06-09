import { useEffect, useState } from 'react'
import { Users, Search } from 'lucide-react'
import { groupsApi } from '@/api/groupsApi'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminGroups() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    groupsApi.list({ search }).then(setGroups).finally(() => setLoading(false))
  }, [search])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Всі групи</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Пошук груп..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {groups.length === 0 ? (
        <EmptyState illustration="https://illustrations.popsy.co/violet/social-media.svg" title="Немає груп" description="На платформі ще не створено жодної групи" />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Назва</th>
                <th className="px-4 py-3 text-center">Студентів</th>
                <th className="px-4 py-3 text-center">Код</th>
                <th className="px-4 py-3 text-left">Створено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {groups.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{g.name}</p>
                        {g.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{g.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{g.member_count}</td>
                  <td className="px-4 py-3 text-center">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-0.5 font-mono">{g.invite_code}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(g.created_at).toLocaleDateString('uk-UA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
