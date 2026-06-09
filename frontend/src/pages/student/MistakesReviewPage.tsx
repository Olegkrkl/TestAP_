import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, Filter, Lightbulb, Download } from 'lucide-react'
import { resultsApi } from '@/api/usersApi'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import type { QuestionStat } from '@/app/slices/sessionSlice'

type FilterMode = 'all' | 'wrong' | 'correct'

function renderAnswer(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k} → ${v}`)
      .join('; ')
  }
  return String(value)
}

export default function MistakesReviewPage() {
  const { id: testId } = useParams<{ id: string }>()
  const [data, setData] = useState<{
    result: {
      id: string
      score: number
      max_score: number
      percent: number
      passed: boolean
      completed_at: string
      violations: number
      per_question_stats: QuestionStat[]
    }
    test: { id: string; title: string; passing_score: number; show_answers_after: boolean } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('wrong')
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!testId) return
    resultsApi.latestForTest(testId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [testId])

  const filteredStats = useMemo(() => {
    if (!data) return []
    const stats = data.result.per_question_stats
    if (filter === 'wrong') return stats.filter(s => !s.correct)
    if (filter === 'correct') return stats.filter(s => s.correct)
    return stats
  }, [data, filter])

  const toggleAll = () => {
    if (!data) return
    if (expandedSet.size === filteredStats.length) {
      setExpandedSet(new Set())
    } else {
      setExpandedSet(new Set(filteredStats.map(s => s.question_id)))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (error || !data) return (
    <div className="card max-w-md mx-auto text-center">
      <p className="text-gray-700 dark:text-gray-200 mb-4">{error || 'Результат не знайдено'}</p>
      <Link to="/history" className="btn-primary inline-flex">До історії</Link>
    </div>
  )

  const { result, test } = data
  const totalQ = result.per_question_stats.length
  const correctCount = result.per_question_stats.filter(s => s.correct).length
  const wrongCount = totalQ - correctCount

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/history" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> До історії
      </Link>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">
              {test?.title || 'Розбір тесту'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(result.completed_at).toLocaleString('uk-UA')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-2xl font-display font-bold ${result.passed ? 'text-emerald-600' : 'text-rose-500'}`}>
                {result.percent}%
              </p>
              <p className="text-xs text-gray-400">{result.score}/{result.max_score} балів</p>
            </div>
            <Badge variant={result.passed ? 'success' : 'danger'}>
              {result.passed ? 'Пройдено' : 'Не пройдено'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-display font-bold text-emerald-600">{correctCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Правильних</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-display font-bold text-rose-500">{wrongCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Помилок</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 text-center">
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{totalQ}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Всього</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter className="w-4 h-4" /> Фільтр:
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-white/[0.04] p-1">
          {(['wrong', 'all', 'correct'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { setFilter(mode); setExpandedSet(new Set()) }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === mode
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'wrong' && `Помилки (${wrongCount})`}
              {mode === 'correct' && `Правильні (${correctCount})`}
              {mode === 'all' && `Всі (${totalQ})`}
            </button>
          ))}
        </div>
        <button onClick={toggleAll} className="btn-secondary text-xs ml-auto">
          {expandedSet.size === filteredStats.length && filteredStats.length > 0 ? 'Згорнути все' : 'Розгорнути все'}
        </button>
        <button
          onClick={() => resultsApi.downloadCertificate(result.id).catch((e: Error) => alert(e.message))}
          className="btn-primary text-xs gap-1"
        >
          <Download className="w-3.5 h-3.5" /> Сертифікат PDF
        </button>
      </div>

      {/* List */}
      {filteredStats.length === 0 ? (
        <div className="card text-center py-10">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filter === 'wrong' ? 'Жодної помилки!' : 'Немає правильних відповідей'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filter === 'wrong' ? 'Ви відповіли на всі питання правильно 🎉' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStats.map((stat, i) => {
            const idx = result.per_question_stats.findIndex(s => s.question_id === stat.question_id)
            const expanded = expandedSet.has(stat.question_id)
            return (
              <div key={stat.question_id} className={`card p-0 overflow-hidden border-l-4 ${
                stat.correct ? 'border-l-emerald-400' : 'border-l-rose-400'
              }`}>
                <button
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  onClick={() => {
                    const next = new Set(expandedSet)
                    if (next.has(stat.question_id)) next.delete(stat.question_id)
                    else next.add(stat.question_id)
                    setExpandedSet(next)
                  }}
                >
                  {stat.correct
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                  <span className="text-xs text-gray-400 shrink-0 mt-1">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{stat.question_content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={stat.correct ? 'success' : 'danger'}>
                        {stat.points_earned}/{stat.points_possible} б.
                      </Badge>
                      {stat.hint_used && (
                        <Badge variant="warning">
                          <Lightbulb className="w-3 h-3 inline mr-0.5" />підказка
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-white/[0.06]">
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="rounded-xl p-3 bg-gray-50 dark:bg-white/[0.04]">
                        <p className="text-xs font-medium text-gray-500 mb-1">Ваша відповідь</p>
                        <p className={`text-sm font-medium ${stat.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                          {renderAnswer(stat.user_answer)}
                        </p>
                      </div>
                      {!stat.correct && (test?.show_answers_after ?? true) && (
                        <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-xs font-medium text-gray-500 mb-1">Правильна відповідь</p>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {renderAnswer(stat.correct_answer)}
                          </p>
                        </div>
                      )}
                    </div>
                    {stat.explanation && (
                      <div className="bg-primary-50 dark:bg-primary-950/40 rounded-xl p-3 text-sm text-primary-800 dark:text-primary-200">
                        📖 {stat.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
