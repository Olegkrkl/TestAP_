import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FlaskConical, ChevronRight } from 'lucide-react'
import { testsApi } from '@/api/testsApi'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

export default function MyTrainingTests() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testsApi.list({ is_training: true }).then(setTests).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Мої тренувальні тести</h1>
        <Link to="/my-tests/create" className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Створити тест
        </Link>
      </div>

      {tests.length === 0 ? (
        <EmptyState
          illustration="https://illustrations.popsy.co/violet/designer.svg"
          title="Немає тренувальних тестів"
          description="Створіть власний тест для самопідготовки. Він буде видно лише вам."
          action={<Link to="/my-tests/create" className="btn-primary">Створити перший тест</Link>}
        />
      ) : (
        <div className="space-y-3">
          {tests.map(test => (
            <div key={test.id} className="card hover:shadow-card-hover transition-shadow flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{test.title}</p>
                  <p className="text-xs text-gray-400">{test.question_count} питань • {new Date(test.created_at).toLocaleDateString('uk-UA')}</p>
                </div>
              </div>
              <Link to={`/test/${test.id}`} className="btn-primary shrink-0 gap-1">
                Практикувати <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
