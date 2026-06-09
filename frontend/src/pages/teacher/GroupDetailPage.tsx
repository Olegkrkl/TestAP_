import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Trash2, Send, Megaphone, ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { groupsApi } from '@/api/groupsApi'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

type ImportResult = {
  added: number
  created_accounts: number
  skipped: number
  errors: { row: number; email: string; error: string }[]
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showAnn, setShowAnn] = useState(false)
  const [annContent, setAnnContent] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const [g, ann] = await Promise.all([groupsApi.get(id!), groupsApi.getAnnouncements(id!)])
    setGroup(g); setAnnouncements(ann)
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const result = await groupsApi.importMembers(id!, file)
      setImportResult(result)
      await load()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Помилка імпорту')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [id])

  const handleRemoveMember = async (userId: string) => {
    await groupsApi.removeMember(id!, userId)
    setGroup((prev: any) => ({ ...prev, members: prev.members.filter((m: any) => m.user.id !== userId) }))
  }

  const handleAnnounce = async () => {
    if (!annContent.trim()) return
    const a = await groupsApi.createAnnouncement(id!, annContent)
    setAnnouncements(prev => [a, ...prev])
    setAnnContent(''); setShowAnn(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!group) return null

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/teacher/groups" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <p className="text-gray-500 text-sm">{group.member_count} студентів • Код: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{group.invite_code}</code></p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => { setShowImport(true); setImportResult(null); setImportError(null) }} className="btn-secondary gap-2">
            <Upload className="w-4 h-4" />Імпорт CSV
          </button>
          <button onClick={() => setShowAnn(true)} className="btn-primary gap-2">
            <Megaphone className="w-4 h-4" />Оголошення
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold">Студенти ({group.members?.length || 0})</h2>
          </div>
          {group.members?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Немає учасників. Поділіться кодом запрошення.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {group.members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 text-sm font-semibold">
                      {m.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user.full_name}</p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveMember(m.user.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold">Оголошення</h2>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Немає оголошень</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {announcements.map(a => (
                <div key={a.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.author_name} • {new Date(a.created_at).toLocaleDateString('uk-UA')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAnn} onClose={() => setShowAnn(false)} title="Нове оголошення">
        <div className="space-y-4">
          <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} rows={4} className="input resize-none" placeholder="Текст оголошення для групи..." />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAnn(false)} className="btn-secondary">Скасувати</button>
            <button onClick={handleAnnounce} disabled={!annContent.trim()} className="btn-primary gap-2">
              <Send className="w-4 h-4" />Надіслати
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showImport} onClose={() => { if (!importing) setShowImport(false) }} title="Імпорт студентів з CSV">
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>Завантажте CSV-файл зі списком студентів. Підтримувані формати:</p>
            <ul className="list-disc pl-5 text-xs text-gray-500 space-y-0.5">
              <li><code>email</code> — одна колонка з email-ом</li>
              <li><code>email, full_name</code> — email + повне ім'я</li>
            </ul>
            <p className="text-xs text-gray-500">Роздільник: кома або крапка з комою. Для невідомих email-ів буде створено акаунт студента автоматично.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
            }}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />

          {importing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner size="sm" /> Обробка файлу...
            </div>
          )}

          {importError && (
            <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Додано: <strong>{importResult.added}</strong> ·{' '}
                  Створено акаунтів: <strong>{importResult.created_accounts}</strong> ·{' '}
                  Пропущено: <strong>{importResult.skipped}</strong>
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Помилки в рядках:</p>
                  <ul className="space-y-0.5 max-h-32 overflow-y-auto text-amber-700 dark:text-amber-300">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>Рядок {err.row}: {err.email} — {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowImport(false)} disabled={importing} className="btn-secondary">
              Закрити
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
