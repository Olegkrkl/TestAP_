import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart2, Download, Users, TrendingUp } from 'lucide-react'
import { resultsApi } from '@/api/usersApi'
import { testsApi } from '@/api/testsApi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [test, setTest] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      testsApi.get(id),
      resultsApi.forTest(id),
      resultsApi.analytics(id),
    ]).then(([t, r, a]) => {
      setTest(t)
      setResults(r)
      setAnalytics(a)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{test?.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{results.length} спроб</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => testsApi.exportResultsXlsx(id!).catch((e: Error) => alert(e.message))}
            className="btn-secondary gap-2"
          >
            <Download className="w-4 h-4" />Excel
          </button>
        </div>
      </div>

      {/* Analytics summary */}
      {analytics && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary-600">{analytics.average_percent}%</p>
            <p className="text-sm text-gray-500 mt-1">Середній бал</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{analytics.pass_rate}%</p>
            <p className="text-sm text-gray-500 mt-1">Пройшли тест</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{analytics.total_attempts}</p>
            <p className="text-sm text-gray-500 mt-1">Всього спроб</p>
          </div>
        </div>
      )}

      {/* Dynamics — average score over time */}
      {analytics?.dynamics?.length > 1 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />Динаміка середнього балу
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.dynamics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                labelFormatter={(d: string) => new Date(d).toLocaleDateString('uk-UA')}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    average: 'Середній бал',
                    rolling_avg: 'Кумулятивний',
                    pass_rate: 'Прохідність',
                  }
                  return [`${value}%`, labels[name] || name]
                }}
              />
              <Legend
                formatter={(v: string) => ({
                  average: 'За день',
                  rolling_avg: 'Кумулятивний',
                  pass_rate: 'Прохідність',
                }[v] || v)}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="average" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rolling_avg" stroke="#10b981" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <Line type="monotone" dataKey="pass_rate" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score distribution chart */}
        {analytics?.score_distribution && (
          <div className="card">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4" />Розподіл балів</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hardest questions */}
        {analytics?.question_stats?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-4">Складність питань</h2>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {analytics.question_stats.slice(0, 8).map((qs: any, i: number) => (
                <div key={qs.question_id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{qs.content}</p>
                  </div>
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 shrink-0">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${qs.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right shrink-0">{qs.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold">Результати студентів</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Студент</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-center">Бал</th>
                <th className="px-4 py-3 text-center">%</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Порушення</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm font-medium">{r.user_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">{r.user_email}</td>
                  <td className="px-4 py-3 text-center text-sm">{r.score}/{r.max_score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-sm ${r.percent >= 80 ? 'text-green-600' : r.percent >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{r.percent}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'Пройдено' : 'Не пройдено'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-sm hidden md:table-cell">
                    {r.violations > 0 ? <span className="text-red-500 font-medium">{r.violations}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden lg:table-cell">{new Date(r.completed_at).toLocaleDateString('uk-UA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
