import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, ArrowRight, X } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import Spinner from '@/components/ui/Spinner'

interface CalendarTest {
  id: string
  title: string
  closes_at: string | null
  opens_at: string | null
  group_id: string | null
  status: string
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-based week: 0=Mon, 6=Sun
  let startOffset = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isUrgent(test: CalendarTest): boolean {
  if (!test.closes_at) return false
  const diff = new Date(test.closes_at).getTime() - Date.now()
  return diff > 0 && diff < 48 * 60 * 60 * 1000
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tests, setTests] = useState<CalendarTest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    testsApi.calendar().then(setTests).finally(() => setLoading(false))
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const days = getMonthDays(year, month)

  function testsForDay(day: Date): CalendarTest[] {
    return tests.filter(t => {
      const closeDate = t.closes_at ? new Date(t.closes_at) : null
      const openDate = t.opens_at ? new Date(t.opens_at) : null
      return (closeDate && isSameDay(closeDate, day)) || (openDate && isSameDay(openDate, day))
    })
  }

  function dotType(day: Date): 'urgent' | 'normal' | null {
    const dayTests = testsForDay(day)
    if (dayTests.length === 0) return null
    if (dayTests.some(isUrgent)) return 'urgent'
    return 'normal'
  }

  const selectedDayTests = selectedDay ? testsForDay(selectedDay) : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Календар тестів</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Терміни здачі та дати відкриття тестів</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="md" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const dot = dotType(day)
                const isToday = isSameDay(day, today)
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                const hasTests = dot !== null

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative flex flex-col items-center justify-start py-2 rounded-xl transition-all duration-150
                      ${isSelected
                        ? 'text-white'
                        : isToday
                          ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-200'
                      }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, #7c3aed, #9333ea)' } : {}}
                  >
                    <span className="text-sm font-medium">{day.getDate()}</span>
                    {hasTests && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white/70' :
                        dot === 'urgent' ? 'bg-rose-500' : 'bg-primary-500'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-primary-500" /> Тест
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Дедлайн &lt;48h
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="card">
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                    {WEEKDAYS[(selectedDay.getDay() + 6) % 7]}
                  </p>
                  <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                    {selectedDay.getDate()} {MONTHS[selectedDay.getMonth()]}
                  </h3>
                </div>
                <button onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayTests.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Тестів немає</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayTests.map(test => {
                    const urgent = isUrgent(test)
                    return (
                      <div key={test.id}
                        className={`rounded-xl p-3 border ${urgent
                          ? 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/20'
                          : 'border-primary-100 dark:border-primary-900/40 bg-primary-50 dark:bg-primary-950/20'
                        }`}>
                        <p className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">{test.title}</p>
                        {test.closes_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Clock className="w-3 h-3" />
                            Дедлайн: {new Date(test.closes_at).toLocaleString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {test.opens_at && !test.closes_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Clock className="w-3 h-3" />
                            Відкривається: {new Date(test.opens_at).toLocaleString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <Link to={`/test/${test.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                          Розпочати <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <CalendarDays className="w-12 h-12 text-primary-200 dark:text-primary-900 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Оберіть день,<br/>щоб побачити тести</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming tests list */}
      {tests.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-4">Найближчі дедлайни</h2>
          <div className="space-y-2">
            {tests
              .filter(t => t.closes_at && new Date(t.closes_at) > new Date())
              .sort((a, b) => new Date(a.closes_at!).getTime() - new Date(b.closes_at!).getTime())
              .slice(0, 5)
              .map(test => {
                const urgent = isUrgent(test)
                return (
                  <div key={test.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${urgent ? 'bg-rose-500' : 'bg-primary-500'}`} />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{test.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className={`text-xs font-medium ${urgent ? 'text-rose-500' : 'text-gray-400'}`}>
                        {new Date(test.closes_at!).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })}
                      </p>
                      <Link to={`/test/${test.id}`} className="btn-primary py-1 px-3 text-xs">
                        Старт
                      </Link>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
