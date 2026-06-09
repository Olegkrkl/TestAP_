import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Upload } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import type { Question } from '@/app/slices/testsSlice'
import QuestionBuilder from '@/components/test/QuestionBuilder'
import Spinner from '@/components/ui/Spinner'
function genId() { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }

const ACCEPT_FORMATS = '.json,.docx,.doc,.xlsx,.txt,.pdf'

export default function CreateTrainingTest() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: genId(),
      test_id: '',
      type: 'single-choice',
      content: '',
      points: 1,
      order_index: prev.length,
      options: { choices: ['', ''], correct: '' },
    }])
  }

  const updateQuestion = (idx: number, update: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...update } : q))
  }

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!title.trim()) return alert('Введіть назву тесту')
    setSaving(true)
    try {
      const test = await testsApi.create({ title, description, is_training: true, status: 'published', attempts_allowed: 999 })
      for (const q of questions) {
        await testsApi.addQuestion(test.id, {
          type: q.type, content: q.content, hint: q.hint, explanation: q.explanation,
          points: q.points, order_index: q.order_index, options: q.options,
        })
      }
      navigate('/my-tests')
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
        setImportError('У файлі не знайдено жодного питання. Перевірте формат (Q:/A:/* для текстових файлів).')
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
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Новий тренувальний тест</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Назва тесту</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Мій тренувальний тест" />
        </div>
        <div>
          <label className="label">Опис (необов'язково)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Для чого цей тест..." />
        </div>
        <div>
          <label className="label">Імпорт питань (JSON, DOCX, DOC, XLSX, TXT, PDF)</label>
          <div className="flex gap-2">
            <input
              type="file"
              accept={ACCEPT_FORMATS}
              onChange={e => { setImportFile(e.target.files?.[0] || null); setImportError(null); setImportNotice(null) }}
              className="input flex-1"
            />
            <button onClick={handleImport} disabled={!importFile || importing} className="btn-secondary gap-1 min-w-[140px] justify-center">
              {importing ? <Spinner size="sm" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Парсимо...' : 'Імпортувати'}
            </button>
          </div>
          {importError && (
            <p className="text-xs text-rose-500 mt-1.5">{importError}</p>
          )}
          {importNotice && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">{importNotice}</p>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Для DOCX, TXT, PDF використовуйте формат: <code className="font-mono">Q:</code> питання, <code className="font-mono">A:</code> варіант, <code className="font-mono">*</code> правильна відповідь. Для XLSX — колонки: питання | тип | підказка | варіанти через <code className="font-mono">|</code> | правильна.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionBuilder
            key={q.id}
            question={q}
            index={i}
            onChange={update => updateQuestion(i, update)}
            onDelete={() => deleteQuestion(i)}
          />
        ))}
      </div>

      <button onClick={addQuestion} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-4 flex items-center justify-center gap-2 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
        <Plus className="w-5 h-5" />
        Додати питання
      </button>
    </div>
  )
}
