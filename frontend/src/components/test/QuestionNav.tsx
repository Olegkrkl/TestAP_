import Tooltip from '@/components/ui/Tooltip'

interface Props {
  questions: Array<{ id: string }>
  currentIndex: number
  answers: Record<string, unknown>
  flagged: string[]
  onNavigate: (index: number) => void
}

function getTooltip(isCurrent: boolean, isFlagged: boolean, isAnswered: boolean): string {
  if (isCurrent) return 'Поточне питання'
  if (isFlagged) return 'Позначено для перегляду'
  if (isAnswered) return 'Відповідь надано'
  return 'Без відповіді'
}

export default function QuestionNav({ questions, currentIndex, answers, flagged, onNavigate }: Props) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">НАВІГАЦІЯ</p>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
          const isFlagged = flagged.includes(q.id)
          const isCurrent = i === currentIndex

          let cls = 'w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer touch-manipulation '
          if (isCurrent) cls += 'bg-primary-600 text-white'
          else if (isFlagged) cls += 'bg-yellow-400 text-yellow-900'
          else if (isAnswered) cls += 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          else cls += 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'

          return (
            <Tooltip key={q.id} content={getTooltip(isCurrent, isFlagged, isAnswered)}>
              <button className={cls} onClick={() => onNavigate(i)}>
                {i + 1}
              </button>
            </Tooltip>
          )
        })}
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 inline-block" />Відповідь надано</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />Позначено</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 inline-block" />Без відповіді</div>
      </div>
    </div>
  )
}
