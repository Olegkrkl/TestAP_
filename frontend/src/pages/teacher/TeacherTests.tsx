import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Copy, Trash2, Edit, BarChart2, Send, Archive, BookOpen } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'

export default function TeacherTests() {
  const [tests, setTests] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = () => {
    testsApi.list().then(data => { setTests(data); setFiltered(data) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let f = tests
    if (search) f = f.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) f = f.filter(t => t.status === statusFilter)
    setFiltered(f)
  }, [search, statusFilter, tests])

  const handleCopy = async (id: string) => {
    try { const t = await testsApi.copy(id); setTests(prev => [t, ...prev]) }
    catch (e: any) { alert(e.message) }
  }

  const handlePublish = async (id: string) => {
    const t = await testsApi.publish(id)
    setTests(prev => prev.map(x => x.id === id ? t : x))
  }

  const handleArchive = async (id: string) => {
    const t = await testsApi.archive(id)
    setTests(prev => prev.map(x => x.id === id ? t : x))
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await testsApi.delete(deleteId)
    setTests(prev => prev.filter(t => t.id !== deleteId))
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const statusBadge = (s: string) => {
    if (s === 'published') return <Badge variant="success">Опубліковано</Badge>
    if (s === 'archived') return <Badge variant="warning">Архів</Badge>
    return <Badge variant="gray">Чернетка</Badge>
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Бібліотека тестів</h1>
        <Link to="/teacher/tests/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" />Створити тест
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Пошук тестів..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">Всі статуси</option>
          <option value="draft">Чернетка</option>
          <option value="published">Опубліковано</option>
          <option value="archived">Архів</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState illustration="https://illustrations.popsy.co/violet/graduation.svg" title="Тестів не знайдено" description="Створіть перший тест та почніть навчати студентів" action={<Link to="/teacher/tests/create" className="btn-primary">Створити тест</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(test => (
            <div key={test.id} className="card hover:shadow-card-hover transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                {statusBadge(test.status)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{test.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{test.question_count} питань • {test.attempts_allowed} спроб</p>
              </div>
              <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-700 flex-wrap">
                <Link to={`/teacher/tests/${test.id}/edit`} className="btn-ghost text-xs p-1.5 gap-1"><Edit className="w-3.5 h-3.5" />Ред.</Link>
                <Link to={`/teacher/tests/${test.id}/results`} className="btn-ghost text-xs p-1.5 gap-1"><BarChart2 className="w-3.5 h-3.5" />Рез.</Link>
                <button onClick={() => handleCopy(test.id)} className="btn-ghost text-xs p-1.5 gap-1"><Copy className="w-3.5 h-3.5" />Копія</button>
                {test.status === 'draft' && <button onClick={() => handlePublish(test.id)} className="btn-ghost text-xs p-1.5 gap-1 text-green-600"><Send className="w-3.5 h-3.5" />Опубл.</button>}
                {test.status === 'published' && <button onClick={() => handleArchive(test.id)} className="btn-ghost text-xs p-1.5 gap-1"><Archive className="w-3.5 h-3.5" />Архів</button>}
                <button onClick={() => setDeleteId(test.id)} className="btn-ghost text-xs p-1.5 gap-1 text-red-500 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Видалити тест?"
        message="Тест і всі результати буде видалено назавжди."
        confirmLabel="Видалити"
        danger
      />
    </div>
  )
}
