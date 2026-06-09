import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Plus, Upload, Send } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import type { Question } from '@/app/slices/testsSlice'
import QuestionBuilder from '@/components/test/QuestionBuilder'
import Spinner from '@/components/ui/Spinner'

const ACCEPT_FORMATS = '.json,.docx,.doc,.xlsx,.txt,.pdf'

function genId() { return Math.random().toString(36).slice(2) }

export default function CreateTestPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', time_limit: '', attempts_allowed: 1,
    passing_score: 60, shuffle_questions: false, shuffle_answers: false,
    show_answers_after: true, copy_protection: false, tab_switch_detection: false,
    opens_at: '', closes_at: '', tags: '', category: '',
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const updateForm = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }))

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: genId(), test_id: '', type: 'single-choice', content: '',
      points: 1, order_index: prev.length, options: { choices: ['', ''], correct: '' },
    }])
  }

  const handleSave = async (status = 'draft') => {
    if (!form.title.trim()) return alert('Введіть назву тесту')
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title, description: form.description || null,
        time_limit: form.time_limit ? Number(form.time_limit) : null,
        attempts_allowed: form.attempts_allowed,
        passing_score: form.passing_score,
        shuffle_questions: form.shuffle_questions,
        shuffle_answers: form.shuffle_answers,
        show_answers_after: form.show_answers_after,
        copy_protection: form.copy_protection,
        tab_switch_detection: form.tab_switch_detection,
        opens_at: form.opens_at || null,
        closes_at: form.closes_at || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        category: form.category || null,
        status,
      }
      const test = await testsApi.create(payload)
      for (const q of questions) {
        await testsApi.addQuestion(test.id, {
          type: q.type, content: q.content, hint: q.hint, explanation: q.explanation,
          points: q.points, order_index: q.order_index, options: q.options,
        })
      }
      navigate('/teacher/tests')
    } catch (e: any) {
      alert(e.message || 'Помилка збереження')
    } finally {
      setSaving(false)
    }
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
        test_id: '',
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

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Створити тест</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary gap-2">
            <Save className="w-4 h-4" />Чернетка
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="btn-primary gap-2">
            <Send className="w-4 h-4" />{saving ? 'Збереження...' : 'Опублікувати'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Settings panel */}
        <div className="card space-y-4 lg:sticky lg:top-20">
          <h2 className="font-semibold text-gray-900 dark:text-white">Налаштування</h2>
          <div>
            <label className="label">Назва *</label>
            <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} className="input" placeholder="Назва тесту" />
          </div>
          <div>
            <label className="label">Опис</label>
            <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={2} className="input resize-none" placeholder="Опис тесту..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ліміт часу (хв)</label>
              <input type="number" value={form.time_limit} onChange={e => updateForm('time_limit', e.target.value)} className="input" placeholder="Без ліміту" />
            </div>
            <div>
              <label className="label">Спроби</label>
              <input type="number" min={1} value={form.attempts_allowed} onChange={e => updateForm('attempts_allowed', Number(e.target.value))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Прохідний бал (%)</label>
            <input type="number" min={0} max={100} value={form.passing_score} onChange={e => updateForm('passing_score', Number(e.target.value))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Відкриття</label>
              <input type="datetime-local" value={form.opens_at} onChange={e => updateForm('opens_at', e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="label">Закриття</label>
              <input type="datetime-local" value={form.closes_at} onChange={e => updateForm('closes_at', e.target.value)} className="input text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              ['shuffle_questions', 'Перемішати питання'],
              ['shuffle_answers', 'Перемішати відповіді'],
              ['show_answers_after', 'Показати відповіді після'],
              ['copy_protection', 'Захист від копіювання'],
              ['tab_switch_detection', 'Фіксація виходу з вкладки'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => updateForm(key, e.target.checked)} className="accent-primary-600" />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className="label">Теги (через кому)</label>
            <input type="text" value={form.tags} onChange={e => updateForm('tags', e.target.value)} className="input" placeholder="математика, алгебра" />
          </div>
          <div>
            <label className="label">Категорія</label>
            <input type="text" value={form.category} onChange={e => updateForm('category', e.target.value)} className="input" placeholder="Математика" />
          </div>
          <div>
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

        {/* Questions panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Питання ({questions.length})</h2>
          </div>

          {questions.map((q, i) => (
            <QuestionBuilder
              key={q.id}
              question={q}
              index={i}
              onChange={update => setQuestions(prev => prev.map((x, j) => j === i ? { ...x, ...update } : x))}
              onDelete={() => setQuestions(prev => prev.filter((_, j) => j !== i))}
            />
          ))}

          <button onClick={addQuestion} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-4 flex items-center justify-center gap-2 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
            <Plus className="w-5 h-5" />
            Додати питання
          </button>
        </div>
      </div>
    </div>
  )
}
