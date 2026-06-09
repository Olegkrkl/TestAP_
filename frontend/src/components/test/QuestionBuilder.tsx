import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { Question } from '@/app/slices/testsSlice'

interface Props {
  question: Question
  index: number
  onChange: (updated: Partial<Question>) => void
  onDelete: () => void
}

const QUESTION_TYPES = [
  'single-choice', 'multiple-choice', 'true-false',
  'open-answer', 'fill-blank', 'matching', 'ordering',
]

export default function QuestionBuilder({ question, index, onChange, onDelete }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)

  const updateOption = (key: string, value: unknown) => {
    onChange({ options: { ...question.options, [key]: value } })
  }

  const renderOptionsEditor = () => {
    const { type, options } = question
    const choices = (options.choices as string[]) || ['', '']

    if (type === 'single-choice' || type === 'multiple-choice') {
      return (
        <div className="space-y-2">
          <label className="label">{t('teacher.options')}</label>
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={type === 'multiple-choice' ? 'checkbox' : 'radio'}
                name={`correct-${question.id}`}
                checked={type === 'multiple-choice'
                  ? ((options.correct as string[]) || []).includes(c)
                  : options.correct === c}
                onChange={() => {
                  if (type === 'multiple-choice') {
                    const curr = (options.correct as string[]) || []
                    updateOption('correct', curr.includes(c) ? curr.filter(x => x !== c) : [...curr, c])
                  } else {
                    updateOption('correct', c)
                  }
                }}
                className="accent-primary-600"
              />
              <input
                type="text"
                value={c}
                onChange={e => {
                  const updated = [...choices]; updated[i] = e.target.value
                  updateOption('choices', updated)
                }}
                placeholder={`Варіант ${i + 1}`}
                className="input flex-1"
              />
              {choices.length > 2 && (
                <button onClick={() => updateOption('choices', choices.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => updateOption('choices', [...choices, ''])} className="btn-ghost text-sm gap-1">
            <Plus className="w-4 h-4" /> Додати варіант
          </button>
        </div>
      )
    }

    if (type === 'true-false') {
      return (
        <div>
          <label className="label">{t('teacher.correctAnswer')}</label>
          <div className="flex gap-3">
            {['true', 'false'].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={options.correct === v} onChange={() => updateOption('correct', v)} className="accent-primary-600" />
                <span>{v === 'true' ? 'Правда' : 'Неправда'}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    if (type === 'open-answer') {
      const kws = (options.auto_keywords as string[]) || []
      return (
        <div>
          <label className="label">Ключові слова (авто-перевірка, через кому)</label>
          <input
            type="text"
            value={kws.join(', ')}
            onChange={e => updateOption('auto_keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="напр.: фотосинтез, хлорофіл"
            className="input"
          />
        </div>
      )
    }

    if (type === 'ordering') {
      return (
        <div>
          <label className="label">Правильний порядок (кожен елемент з нового рядка)</label>
          <textarea
            value={(options.choices as string[] || []).join('\n')}
            onChange={e => {
              const items = e.target.value.split('\n').filter(Boolean)
              updateOption('choices', items)
              updateOption('correct', items)
            }}
            rows={4}
            className="input resize-none"
            placeholder="Перший&#10;Другий&#10;Третій"
          />
        </div>
      )
    }

    if (type === 'matching') {
      const left = (options.left as string[]) || ['', '']
      const right = (options.right as string[]) || ['', '']
      const correct = (options.correct as Record<string, string>) || {}
      return (
        <div className="space-y-2">
          <label className="label">Пари відповідностей</label>
          {left.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="text" value={l} onChange={e => { const u = [...left]; u[i] = e.target.value; updateOption('left', u) }} placeholder={`Ліве ${i + 1}`} className="input flex-1" />
              <span className="text-gray-400">→</span>
              <input type="text" value={right[i] || ''} onChange={e => { const u = [...right]; u[i] = e.target.value; updateOption('right', u); updateOption('correct', { ...correct, [l]: e.target.value }) }} placeholder={`Праве ${i + 1}`} className="input flex-1" />
            </div>
          ))}
          <button onClick={() => { updateOption('left', [...left, '']); updateOption('right', [...right, '']) }} className="btn-ghost text-sm gap-1">
            <Plus className="w-4 h-4" /> Додати пару
          </button>
        </div>
      )
    }

    if (type === 'fill-blank') {
      return (
        <div>
          <p className="text-xs text-gray-500 mb-2">Використовуйте ___ для позначення пропуску в тексті питання</p>
          <label className="label">Правильні відповіді (через кому)</label>
          <input
            type="text"
            value={((options.correct as string[]) || []).join(', ')}
            onChange={e => updateOption('correct', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="input"
            placeholder="відповідь1, відповідь2"
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {question.content || 'Нове питання'}
        </span>
        <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs">
          {t(`questionTypes.${question.type}`)}
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('teacher.questionType')}</label>
              <select value={question.type} onChange={e => onChange({ type: e.target.value, options: {} })} className="input">
                {QUESTION_TYPES.map(t => (
                  <option key={t} value={t}>{useTranslationForType(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('teacher.points')}</label>
              <input type="number" min={1} value={question.points} onChange={e => onChange({ points: Number(e.target.value) })} className="input" />
            </div>
          </div>

          <div>
            <label className="label">{t('teacher.questionContent')}</label>
            <textarea
              value={question.content}
              onChange={e => onChange({ content: e.target.value })}
              rows={2}
              className="input resize-none"
              placeholder="Введіть текст питання..."
            />
          </div>

          {renderOptionsEditor()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('teacher.hint')}</label>
              <input type="text" value={question.hint || ''} onChange={e => onChange({ hint: e.target.value })} className="input" placeholder="Необов'язково" />
            </div>
            <div>
              <label className="label">{t('teacher.explanation')}</label>
              <input type="text" value={question.explanation || ''} onChange={e => onChange({ explanation: e.target.value })} className="input" placeholder="Пояснення після відповіді" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function useTranslationForType(type: string): string {
  const labels: Record<string, string> = {
    'single-choice': 'Одиночний вибір',
    'multiple-choice': 'Множинний вибір',
    'true-false': 'Правда/Неправда',
    'open-answer': 'Відкрита відповідь',
    'fill-blank': 'Заповни пропуск',
    'matching': 'На відповідність',
    'ordering': 'Впорядкування',
  }
  return labels[type] || type
}
