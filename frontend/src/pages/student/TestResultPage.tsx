import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Home, RotateCcw, Trophy, Download } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { sessionsApi } from '@/api/sessionsApi'
import { resultsApi } from '@/api/usersApi'
import type { TestResult, QuestionStat } from '@/app/slices/sessionSlice'
import ResultCircle from '@/components/ui/ResultCircle'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

export default function TestResultPage() {
  const { id } = useParams<{ id: string }>()
  const { result: storedResult, activeSession } = useAppSelector(s => s.session)
  const [result, setResult] = useState<TestResult | null>(storedResult)
  const [loading, setLoading] = useState(!storedResult)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!result && activeSession) {
      sessionsApi.getResult(activeSession.id).then(setResult).finally(() => setLoading(false))
    }
  }, [result, activeSession])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!result) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Результат не знайдено</p>
      <Link to="/tests" className="btn-primary mt-4 inline-flex">До тестів</Link>
    </div>
  )

  const correctCount = result.per_question_stats.filter(q => q.correct).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Result card */}
      <div className="card text-center overflow-hidden">
        {/* Passed/Failed gradient banner */}
        {result.passed ? (
          <div className="relative -mx-6 -mt-6 mb-6 py-6 px-6 text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)' }}>
            <div className="absolute right-4 top-0 text-[80px] leading-none opacity-10 select-none">🏆</div>
            <div className="relative flex items-center justify-center gap-3">
              <Trophy className="w-7 h-7" />
              <span className="font-display font-bold text-2xl">Тест пройдено!</span>
            </div>
          </div>
        ) : (
          <div className="relative -mx-6 -mt-6 mb-6 py-5 px-6 text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}>
            <div className="relative flex items-center justify-center gap-3">
              <XCircle className="w-6 h-6" />
              <span className="font-display font-bold text-xl">Тест не пройдено</span>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <ResultCircle percent={result.percent} passed={result.passed} size={180} />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3">
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{result.score}/{result.max_score}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Балів</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
            <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Правильно</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3">
            <p className="text-2xl font-display font-bold text-rose-500">{result.per_question_stats.length - correctCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Неправильно</p>
          </div>
        </div>

        {result.violations > 0 && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
            Зафіксовано {result.violations} порушень
          </div>
        )}
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/tests" className="btn-secondary gap-2"><Home className="w-4 h-4" />До тестів</Link>
          <button
            onClick={() => resultsApi.downloadCertificate(result.id).catch((e: Error) => alert(e.message))}
            className="btn-secondary gap-2"
          >
            <Download className="w-4 h-4" />Сертифікат PDF
          </button>
          <Link to={`/test/${id}`} className="btn-primary gap-2"><RotateCcw className="w-4 h-4" />Спробувати ще</Link>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="card">
        <h2 className="font-display font-semibold text-lg mb-4 text-gray-900 dark:text-white">Розбір відповідей</h2>
        <div className="space-y-3">
          {result.per_question_stats.map((stat, i) => (
            <QuestionBreakdown key={stat.question_id} stat={stat} index={i}
              expanded={expandedQ === stat.question_id}
              onToggle={() => setExpandedQ(expandedQ === stat.question_id ? null : stat.question_id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuestionBreakdown({ stat, index, expanded, onToggle }: { stat: QuestionStat; index: number; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-colors ${stat.correct
      ? 'border-emerald-200 dark:border-emerald-800/60'
      : 'border-rose-200 dark:border-rose-800/60'}`}>
      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]" onClick={onToggle}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          stat.correct
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
        }`}>
          {stat.correct ? '✓' : '✗'}
        </span>
        <span className="text-xs text-gray-400 shrink-0">#{index + 1}</span>
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{stat.question_content}</span>
        <Badge variant={stat.correct ? 'success' : 'danger'}>{stat.points_earned}/{stat.points_possible} б.</Badge>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ваша відповідь</p>
              <p className={`text-sm font-medium ${stat.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {typeof stat.user_answer === 'object' ? JSON.stringify(stat.user_answer) : String(stat.user_answer ?? '—')}
              </p>
            </div>
            {!stat.correct && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Правильна відповідь</p>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {typeof stat.correct_answer === 'object' ? JSON.stringify(stat.correct_answer) : String(stat.correct_answer ?? '—')}
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
}
