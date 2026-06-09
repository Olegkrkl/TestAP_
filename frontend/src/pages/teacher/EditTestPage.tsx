import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Plus, Upload } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import type { Question } from '@/app/slices/testsSlice'
import QuestionBuilder from '@/components/test/QuestionBuilder'
import Spinner from '@/components/ui/Spinner'

const ACCEPT_FORMATS = '.json,.docx,.doc,.xlsx,.txt,.pdf'

function genId() { return Math.random().toString(36).slice(2) }

export default function EditTestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    testsApi.get(id).then(t => {
      setTest(t)
      setQuestions(t.questions || [])
    }).finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id || !test) return
    setSaving(true)
    try {
      await testsApi.update(id, {
        title: test.title, description: test.description,
        time_limit: test.time_limit, attempts_allowed: test.attempts_allowed,
        passing_score: test.passing_score, shuffle_questions: test.shuffle_questions,
        shuffle_answers: test.shuffle_answers, show_answers_after: test.show_answers_after,
        copy_protection: test.copy_protection, tab_switch_detection: test.tab_switch_detection,
        opens_at: test.opens_at, closes_at: test.closes_at,
        tags: test.tags, category: test.category,
      })

      // Sync questions: update existing, add new
      const originalIds = new Set((test.questions || []).map((q: Question) => q.id))
      for (const q of questions) {
        if (originalIds.has(q.id)) {
          await testsApi.updateQuestion(id, q.id, {
            type: q.type, content: q.content, hint: q.hint, explanation: q.explanation,
            points: q.points, order_index: q.order_index, options: q.options,
          })
        } else {
          await testsApi.addQuestion(id, {
            type: q.type, content: q.content, hint: q.hint, explanation: q.explanation,
            points: q.points, order_index: q.order_index, options: q.options,
          })
        }
      }
      navigate('/teacher/tests')
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setImportError(null)
    setImportNotice(null)
    try {
      const result = await testsApi.parseFile(importFile)
      if (!result.count) {
        setImportError('У файлі не знайдено жодного питання. Перевірте формат файлу.')
        return
      }
      const baseIdx = questions.length
      const imported: Question[] = result.questions.map((q, i) => ({
        id: genId(),
        test_id: id || '',
        type: (q.type as Question['type']) || 'single-choice',
        content: q.content || '',
        hint: q.hint || undefined,
        explanation: q.explanation || undefined,
        points: q.points || 1,
        order_index: baseIdx + i,
        options: (q.options as Question['options']) || {},
      }))
      setQuestions(prev => [...prev, ...imported])
      setImportFile(null)
      const reviewCount = result.questions.filter(q => q.needs_review).length
      setImportNotice(
        reviewCount > 0
          ? `Імпортовано ${result.count} питань. Для ${reviewCount} не вдалося визначити правильну відповідь — перевірте та позначте її вручну.`
          : `Імпортовано ${result.count} питань.`
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Помилка імпорту файлу'
      setImportError(msg)
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!test) return null

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Редагувати тест</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
          <Save className="w-4 h-4" />{saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="card space-y-4 lg:sticky lg:top-20">
          <h2 className="font-semibold">Налаштування</h2>
          <div>
            <label className="label">Назва</label>
            <input type="text" value={test.title} onChange={e => setTest({ ...test, title: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Опис</label>
            <textarea value={test.description || ''} onChange={e => setTest({ ...test, description: e.target.value })} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ліміт (хв)</label>
              <input type="number" value={test.time_limit || ''} onChange={e => setTest({ ...test, time_limit: e.target.value ? Number(e.target.value) : null })} className="input" />
            </div>
            <div>
              <label className="label">Спроби</label>
              <input type="number" value={test.attempts_allowed} onChange={e => setTest({ ...test, attempts_allowed: Number(e.target.value) })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Прохідний бал (%)</label>
            <input type="number" value={test.passing_score} onChange={e => setTest({ ...test, passing_score: Number(e.target.value) })} className="input" />
          </div>
          {[
            ['shuffle_questions', 'Перемішати питання'],
            ['shuffle_answers', 'Перемішати відповіді'],
            ['show_answers_after', 'Показати відповіді після'],
            ['copy_protection', 'Захист від копіювання'],
            ['tab_switch_detection', 'Фіксація виходу'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={test[key]} onChange={e => setTest({ ...test, [key]: e.target.checked })} className="accent-primary-600" />
              {label}
            </label>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
            <label className="label">Імпорт питань (JSON, DOCX, DOC, XLSX, TXT, PDF)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept={ACCEPT_FORMATS}
                onChange={e => { setImportFile(e.target.files?.[0] || null); setImportError(null); setImportNotice(null) }}
                className="input text-xs flex-1"
              />
              <button onClick={handleImport} disabled={!importFile || importing} className="btn-secondary text-xs px-2 gap-1">
                {importing ? <Spinner size="sm" /> : <Upload className="w-3 h-3" />}
              </button>
            </div>
            {importError && (
              <p className="text-xs text-rose-500 mt-1.5">{importError}</p>
            )}
            {importNotice && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">{importNotice}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Питання ({questions.length})</h2>
          {questions.map((q, i) => (
            <QuestionBuilder
              key={q.id}
              question={q}
              index={i}
              onChange={update => setQuestions(prev => prev.map((x, j) => j === i ? { ...x, ...update } : x))}
              onDelete={() => setQuestions(prev => prev.filter((_, j) => j !== i))}
            />
          ))}
          <button onClick={() => setQuestions(prev => [...prev, { id: genId(), test_id: id || '', type: 'single-choice', content: '', points: 1, order_index: prev.length, options: { choices: ['', ''], correct: '' } }])}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-4 flex items-center justify-center gap-2 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            <Plus className="w-5 h-5" />Додати питання
          </button>
        </div>
      </div>
    </div>
  )
}
