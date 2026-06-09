import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Clock, ChevronRight } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

export default function StudentTests() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<any[]>([])

  useEffect(() => {
    testsApi.list({ status: 'published' }).then(data => {
      setTests(data)
      setFiltered(data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(tests.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)))
  }, [search, tests])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Тести</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Пошук тестів..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="Тести не знайдено" description="Спробуйте змінити пошуковий запит або зачекайте поки викладач призначить тест" />
      ) : (
        <div className="grid gap-4">
          {filtered.map(test => (
            <div key={test.id} className="card hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{test.title}</h3>
                    {test.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{test.description}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">{test.question_count} питань</span>
                      {test.time_limit && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />{test.time_limit} хв
                        </span>
                      )}
                      {test.tags?.map((tag: string) => (
                        <Badge key={tag} variant="primary">{tag}</Badge>
                      ))}
                      {test.closes_at && (
                        <Badge variant="warning">До: {new Date(test.closes_at).toLocaleDateString('uk-UA')}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Link to={`/test/${test.id}/preview`} className="btn-primary shrink-0 gap-1 group-hover:shadow-md transition-shadow">
                  Деталі <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
