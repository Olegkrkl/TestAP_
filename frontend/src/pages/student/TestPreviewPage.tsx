import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Clock, ListChecks, Hash, Target, RefreshCcw, ShieldCheck,
  Shuffle, EyeOff, Eye, CalendarClock, Play, AlertCircle, Trophy,
} from 'lucide-react'
import { testsApi, type TestPreview } from '@/api/testsApi'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(minutes?: number | null): string {
  if (!minutes) return 'Без обмежень'
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} год ${m} хв` : `${h} год`
  }
  return `${minutes} хв`
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  emphasis?: boolean
}

function InfoRow({ icon: Icon, label, value, emphasis }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">{label}</span>
      <span className={`text-sm font-medium ${emphasis ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  )
}

export default function TestPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<TestPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    testsApi.preview(id)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (error || !data) return (
    <div className="card max-w-md mx-auto text-center">
      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
      <p className="text-gray-700 dark:text-gray-200 mb-4">{error || 'Тест не знайдено'}</p>
      <Link to="/tests" className="btn-primary inline-flex">До тестів</Link>
    </div>
  )

  const attemptsLeft = data.attempts_unlimited
    ? Infinity
    : Math.max(0, data.attempts_allowed - data.attempts_used)
  const canStart = data.is_open && (data.attempts_unlimited || attemptsLeft > 0)
  const startLabel = data.has_in_progress_session ? 'Продовжити тест' : 'Почати тест'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/tests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Назад до тестів
      </Link>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          {data.category && <Badge variant="primary">{data.category}</Badge>}
          {data.is_training && <Badge variant="warning">Тренувальний</Badge>}
          {data.has_in_progress_session && <Badge variant="warning">Розпочато</Badge>}
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
          {data.title}
        </h1>
        {data.description && (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{data.description}</p>
        )}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-white/[0.06] rounded-full text-gray-600 dark:text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Key facts grid */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card text-center">
          <ListChecks className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{data.question_count}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Питань</p>
        </div>
        <div className="card text-center">
          <Clock className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{formatDuration(data.time_limit)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Час</p>
        </div>
        <div className="card text-center">
          <Hash className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            {data.attempts_unlimited ? '∞' : `${attemptsLeft}/${data.attempts_allowed}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Спроб залишилось</p>
        </div>
      </div>

      {data.best_percent !== null && data.best_percent !== undefined && (
        <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Ваш найкращий результат</p>
              <p className="text-xl font-display font-bold text-emerald-700 dark:text-emerald-300">{data.best_percent}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="card">
        <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-2">Налаштування</h2>
        <InfoRow icon={Target} label="Прохідний бал" value={`${data.passing_score}%`} />
        <InfoRow icon={Trophy} label="Максимум балів" value={data.total_points} />
        <InfoRow icon={Clock} label="Таймер на питання" value={data.per_question_timer ? 'Так' : 'Ні'} />
        <InfoRow icon={Shuffle} label="Перемішування питань" value={data.shuffle_questions ? 'Так' : 'Ні'} />
        <InfoRow icon={Shuffle} label="Перемішування відповідей" value={data.shuffle_answers ? 'Так' : 'Ні'} />
        <InfoRow icon={data.show_answers_after ? Eye : EyeOff} label="Показ правильних відповідей" value={data.show_answers_after ? 'Після завершення' : 'Не показуються'} />
        <InfoRow icon={ShieldCheck} label="Захист від копіювання" value={data.copy_protection ? 'Увімкнено' : 'Вимкнено'} />
        <InfoRow icon={ShieldCheck} label="Контроль вкладок" value={data.tab_switch_detection ? 'Увімкнено' : 'Вимкнено'} />
        {(data.opens_at || data.closes_at) && (
          <InfoRow icon={CalendarClock} label="Доступний"
            value={`${formatDate(data.opens_at)} — ${formatDate(data.closes_at)}`}
            emphasis />
        )}
      </div>

      {/* Warnings */}
      {!data.is_open && (
        <div className="card bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-300">Тест зараз недоступний</p>
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {data.opens_at && new Date(data.opens_at).getTime() > Date.now()
                ? `Відкривається ${formatDate(data.opens_at)}`
                : data.closes_at && new Date(data.closes_at).getTime() < Date.now()
                ? `Дедлайн пройшов: ${formatDate(data.closes_at)}`
                : 'Тест закритий'}
            </p>
          </div>
        </div>
      )}

      {!data.attempts_unlimited && attemptsLeft <= 0 && (
        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 flex gap-3">
          <RefreshCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-300">Спроби вичерпано</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Ви використали всі {data.attempts_allowed} спроб для цього тесту.
            </p>
          </div>
        </div>
      )}

      {/* Rules note */}
      <div className="card bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/40 text-sm text-primary-800 dark:text-primary-200">
        <p className="font-semibold mb-1">⚠️ Перед стартом:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          {data.time_limit && <li>Таймер запускається одразу і не зупиняється.</li>}
          {data.tab_switch_detection && <li>Перехід в іншу вкладку буде зафіксовано як порушення.</li>}
          {data.copy_protection && <li>Копіювання та виділення тексту заблоковано.</li>}
          <li>Усі відповіді зберігаються автоматично — закриття вкладки безпечне.</li>
        </ul>
      </div>

      {/* Action */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/[0.06] py-4 -mx-4 px-4 flex justify-end gap-3">
        <Link to="/tests" className="btn-secondary">Скасувати</Link>
        <button
          disabled={!canStart}
          onClick={() => navigate(`/test/${data.id}`)}
          className="btn-primary gap-2"
        >
          <Play className="w-4 h-4" />
          {startLabel}
        </button>
      </div>
    </div>
  )
}
