import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ChevronRight, Download } from 'lucide-react'
import { resultsApi } from '@/api/usersApi'
import { testsApi } from '@/api/testsApi'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

interface ResultRow {
  id: string
  test_id: string
  score: number
  max_score: number
  percent: number
  passed: boolean
  completed_at: string
}

export default function TestHistoryPage() {
  const [results, setResults] = useState<ResultRow[]>([])
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resultsApi.my().then(async (rs: ResultRow[]) => {
      setResults(rs)
      // Resolve a title for every distinct test referenced in history.
      const ids = Array.from(new Set(rs.map(r => r.test_id)))
      const map: Record<string, string> = {}
      await Promise.all(ids.map(async (id) => {
        try {
          const t = await testsApi.get(id)
          map[id] = t.title
        } catch {
          map[id] = id
        }
      }))
      setTitles(map)
    }).finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => results, [results])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Історія тестів</h1>

      {results.length === 0 ? (
        <EmptyState icon={History} title="Ще немає результатів" description="Пройдіть свій перший тест і він з'явиться тут" action={<Link to="/tests" className="btn-primary">До тестів</Link>} />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Тест</th>
                <th className="px-4 py-3 text-center">Бал</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {titles[r.test_id] || r.test_id}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${r.percent >= 80 ? 'text-green-600' : r.percent >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {r.percent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'Пройдено' : 'Не пройдено'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{new Date(r.completed_at).toLocaleDateString('uk-UA')}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => resultsApi.downloadCertificate(r.id).catch((e: Error) => alert(e.message))}
                      title="Завантажити сертифікат"
                      className="inline-flex items-center text-gray-400 hover:text-primary-600 mr-3"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <Link to={`/test/${r.test_id}/review`} className="inline-flex items-center text-primary-600 hover:text-primary-700">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
