import { useEffect, useState } from 'react'
import { Search, Shield, ShieldOff, Trash2 } from 'lucide-react'
import { usersApi } from '@/api/usersApi'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = () => usersApi.list({ search, role: roleFilter }).then(setUsers).finally(() => setLoading(false))
  useEffect(() => { load() }, [search, roleFilter])

  const toggleActive = async (user: any) => {
    const updated = await usersApi.update(user.id, { is_active: !user.is_active })
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u))
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await usersApi.delete(deleteId)
    setUsers(prev => prev.filter(u => u.id !== deleteId))
  }

  const roleBadge = (role: string) => {
    if (role === 'admin') return <Badge variant="danger">Адмін</Badge>
    if (role === 'teacher') return <Badge variant="primary">Викладач</Badge>
    return <Badge variant="gray">Студент</Badge>
  }

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Користувачі</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Пошук по імені або email..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input w-auto">
          <option value="">Всі ролі</option>
          <option value="student">Студент</option>
          <option value="teacher">Викладач</option>
          <option value="admin">Адміністратор</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Користувач</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-center">Роль</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Зареєстровано</th>
                <th className="px-4 py-3 text-center">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-center">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Активний' : 'Заблокований'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{new Date(u.created_at).toLocaleDateString('uk-UA')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleActive(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title={u.is_active ? 'Заблокувати' : 'Активувати'}>
                        {u.is_active ? <ShieldOff className="w-4 h-4 text-red-500" /> : <Shield className="w-4 h-4 text-green-500" />}
                      </button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Видалити користувача?" message="Всі дані користувача будуть видалені назавжди." confirmLabel="Видалити" danger />
    </div>
  )
}
