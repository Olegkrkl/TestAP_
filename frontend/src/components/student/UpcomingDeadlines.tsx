import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, AlertTriangle, ChevronRight, ArrowRight } from 'lucide-react'
import { testsApi } from '@/api/testsApi'

interface DeadlineItem {
  id: string
  title: string
  closes_at: string | null
  opens_at: string | null
  status: string
}

type Urgency = 'overdue' | 'today' | 'soon' | 'later'

function classify(closesAt: string | null): { urgency: Urgency; hoursLeft: number } {
  if (!closesAt) return { urgency: 'later', hoursLeft: Infinity }
  const ms = new Date(closesAt).getTime() - Date.now()
  const hours = ms / 36e5
  if (hours <= 0) return { urgency: 'overdue', hoursLeft: hours }
  if (hours <= 24) return { urgency: 'today', hoursLeft: hours }
  if (hours <= 24 * 3) return { urgency: 'soon', hoursLeft: hours }
  return { urgency: 'later', hoursLeft: hours }
}

const STYLES: Record<Urgency, { bar: string; bg: string; text: string; label: string }> = {
  overdue: {
    bar: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50',
    text: 'text-rose-700 dark:text-rose-300',
    label: 'Дедлайн минув',
  },
  today: {
    bar: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50',
    text: 'text-rose-700 dark:text-rose-300',
    label: 'Сьогодні',
  },
  soon: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Скоро',
  },
  later: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Є час',
  },
}

function formatLeft(hours: number): string {
  if (hours <= 0) return 'прострочено'
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours))
    return `за ${h} год`
  }
  const days = Math.round(hours / 24)
  return `за ${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`
}

export default function UpcomingDeadlines() {
  const [items, setItems] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testsApi.calendar()
      .then((data: DeadlineItem[]) => setItems(data.filter(t => t.closes_at)))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    return [...items]
      .filter(t => t.closes_at)
      .sort((a, b) => new Date(a.closes_at!).getTime() - new Date(b.closes_at!).getTime())
      .slice(0, 5)
  }, [items])

  if (loading) return null
  if (sorted.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary-500" />
          <h2 className="font-display font-semibold text-gray-900 dark:text-white">Найближчі дедлайни</h2>
        </div>
        <Link to="/calendar" className="text-primary-600 dark:text-primary-400 text-sm flex items-center gap-1 hover:underline">
          Календар <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {sorted.map(test => {
          const { urgency, hoursLeft } = classify(test.closes_at)
          const style = STYLES[urgency]
          return (
            <Link
              key={test.id}
              to={`/test/${test.id}/preview`}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:shadow-sm ${style.bg}`}
            >
              <div className={`w-1 self-stretch rounded-full ${style.bar}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{test.title}</p>
                <p className={`text-xs ${style.text} flex items-center gap-1.5 mt-0.5`}>
                  {urgency === 'overdue' || urgency === 'today' ? <AlertTriangle className="w-3 h-3" /> : null}
                  {style.label} · {formatLeft(hoursLeft)} · {new Date(test.closes_at!).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
