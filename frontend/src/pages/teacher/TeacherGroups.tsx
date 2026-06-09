import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Copy, Trash2 } from 'lucide-react'
import { groupsApi } from '@/api/groupsApi'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'

export default function TeacherGroups() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = () => groupsApi.list().then(setGroups).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const g = await groupsApi.create({ name, description })
      setGroups(prev => [g, ...prev])
      setShowCreate(false); setName(''); setDescription('')
    } catch (e: any) { alert(e.message) }
    finally { setCreating(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await groupsApi.delete(deleteId)
    setGroups(prev => prev.filter(g => g.id !== deleteId))
  }

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); alert(`Код скопійовано: ${code}`) }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Групи</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />Створити групу
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState illustration="https://illustrations.popsy.co/amber/social-media.svg" title="Немає груп" description="Створіть першу групу та додайте студентів" action={<button onClick={() => setShowCreate(true)} className="btn-primary">Створити групу</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map(g => (
            <div key={g.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <button onClick={() => setDeleteId(g.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{g.name}</h3>
              {g.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{g.description}</p>}
              <p className="text-sm text-gray-400 mt-1">{g.member_count} студентів</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 font-mono">{g.invite_code}</code>
                <button onClick={() => copyCode(g.invite_code)} className="btn-ghost p-1.5">
                  <Copy className="w-4 h-4" />
                </button>
                <Link to={`/teacher/groups/${g.id}`} className="btn-primary text-xs py-1.5 px-3">Деталі</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Нова група">
        <div className="space-y-4">
          <div>
            <label className="label">Назва групи *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Наприклад: Група А-1" />
          </div>
          <div>
            <label className="label">Опис</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Необов'язково" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Скасувати</button>
            <button onClick={handleCreate} disabled={creating || !name.trim()} className="btn-primary">
              {creating ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Видалити групу?" message="Всі учасники будуть видалені з групи." confirmLabel="Видалити" danger />
    </div>
  )
}
