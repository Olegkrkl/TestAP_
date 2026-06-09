import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flag, Lightbulb, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setSession, setResult, updateAnswer, toggleFlag } from '@/app/slices/sessionSlice'
import { setActiveTest } from '@/app/slices/testsSlice'
import { sessionsApi } from '@/api/sessionsApi'
import { testsApi } from '@/api/testsApi'
import TestTimer from '@/components/test/TestTimer'
import QuestionRenderer from '@/components/test/QuestionRenderer'
import QuestionNav from '@/components/test/QuestionNav'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { activeSession } = useAppSelector(s => s.session)
  const { activeTest } = useAppSelector(s => s.tests)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [violations, setViolations] = useState(0)

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const [test, session] = await Promise.all([
        testsApi.get(id),
        sessionsApi.start(id),
      ])
      dispatch(setActiveTest(test))
      dispatch(setSession(session))
      setLoading(false)
    }
    init().catch(err => {
      alert(err.message || 'Помилка завантаження тесту')
      navigate('/tests')
    })
  }, [id, dispatch, navigate])

  // Anti-cheat: fire a violation on any focus loss — tab switch, window
  // minimize, alt-tab, opening another window/app. We debounce so the
  // visibilitychange + blur pair (which fire together on minimize) counts once.
  useEffect(() => {
    if (!activeTest?.tab_switch_detection || !activeSession) return
    let lastFiredAt = 0
    let timer: number | null = null

    const fire = (reason: string) => {
      const now = Date.now()
      if (now - lastFiredAt < 1500) return // collapse duplicates
      lastFiredAt = now
      setViolations(v => {
        const next = v + 1
        sessionsApi.reportViolation(activeSession.id, reason).catch(() => {})
        // Use setTimeout so React state can settle before the modal alert blocks the thread.
        timer = window.setTimeout(() => {
          alert(`Увага! Зафіксовано вихід з вкладки/вікна (порушення #${next})`)
        }, 0)
        return next
      })
    }

    const onVisibility = () => { if (document.hidden) fire('tab_hidden') }
    const onBlur = () => { if (!document.hidden) fire('window_blur') }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      if (timer) window.clearTimeout(timer)
    }
  }, [activeTest, activeSession])

  // Copy protection
  useEffect(() => {
    if (!activeTest?.copy_protection) return
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('selectstart', prevent)
    return () => {
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('selectstart', prevent)
    }
  }, [activeTest])

  const handleAnswer = useCallback(async (answer: unknown) => {
    if (!activeSession || !questions[currentIdx]) return
    const qid = questions[currentIdx].id
    dispatch(updateAnswer({ questionId: qid, answer }))
    sessionsApi.saveAnswer(activeSession.id, qid, answer).catch(() => {})
  }, [activeSession, currentIdx, dispatch])

  const handleSubmit = async () => {
    if (!activeSession) return
    setSubmitting(true)
    try {
      const result = await sessionsApi.submit(activeSession.id)
      dispatch(setResult(result))
      navigate(`/test/${id}/result`)
    } catch (e: any) {
      alert(e.message || 'Помилка відправки')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimeUp = useCallback(() => {
    setTimeUp(true)
    setTimeout(handleSubmit, 3000)
  }, [])

  const handleFlagToggle = () => {
    if (!activeSession || !questions[currentIdx]) return
    const qid = questions[currentIdx].id
    dispatch(toggleFlag(qid))
    sessionsApi.flagQuestion(activeSession.id, qid).catch(() => {})
  }

  const handleUseHint = () => {
    if (!activeSession || !questions[currentIdx]) return
    sessionsApi.useHint(activeSession.id, questions[currentIdx].id).catch(() => {})
    setShowHint(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">Завантаження тесту...</p>
      </div>
    </div>
  )

  if (!activeTest || !activeSession) return null

  const questions = activeTest.questions || []
  const currentQ = questions[currentIdx]
  const currentAnswer = activeSession.answers[currentQ?.id] ?? null
  const isFlagged = activeSession.flagged.includes(currentQ?.id)
  const answeredCount = Object.keys(activeSession.answers).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-4">
        <h1 className="font-semibold text-gray-900 dark:text-white flex-1 truncate">{activeTest.title}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
          {currentIdx + 1} / {questions.length}
        </span>
        {activeSession && activeTest.time_limit && (
          <TestTimer sessionId={activeSession.id} onTimeUp={handleTimeUp} />
        )}
        <button onClick={() => setShowConfirm(true)} className="btn-primary" disabled={submitting}>
          <Send className="w-4 h-4" />
          <span className="hidden sm:block">Завершити</span>
        </button>
      </div>

      {timeUp && (
        <div className="bg-red-600 text-white text-center py-3 font-semibold">
          ⏰ Час вийшов! Тест надсилається...
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 grid lg:grid-cols-[1fr_220px] gap-6">
        {/* Question panel */}
        <div className="card space-y-6">
          {/* Progress */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase">Питання {currentIdx + 1}</span>
                <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs">{currentQ?.points} б.</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentQ?.content}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentQ?.hint && (
                <button onClick={handleUseHint} className="btn-ghost p-2" title="Підказка (-0.5 бали)">
                  <Lightbulb className={`w-5 h-5 ${showHint ? 'text-yellow-500' : 'text-gray-400'}`} />
                </button>
              )}
              <button onClick={handleFlagToggle} className="btn-ghost p-2" title="Позначити">
                <Flag className={`w-5 h-5 ${isFlagged ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {showHint && currentQ?.hint && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-yellow-800 dark:text-yellow-200">
              💡 {currentQ.hint}
            </div>
          )}

          <QuestionRenderer
            question={currentQ}
            answer={currentAnswer}
            onChange={handleAnswer}
          />

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => { setCurrentIdx(i => i - 1); setShowHint(false) }}
              disabled={currentIdx === 0}
              className="btn-secondary gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Попереднє
            </button>
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => { setCurrentIdx(i => i + 1); setShowHint(false) }}
                className="btn-primary gap-1"
              >
                Наступне
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="btn-primary gap-1">
                <Send className="w-4 h-4" />
                Завершити
              </button>
            )}
          </div>
        </div>

        {/* Question nav */}
        <div className="space-y-4">
          <QuestionNav
            questions={questions}
            currentIndex={currentIdx}
            answers={activeSession.answers}
            flagged={activeSession.flagged}
            onNavigate={i => { setCurrentIdx(i); setShowHint(false) }}
          />
          {violations > 0 && (
            <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-3">
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">⚠️ Порушень зафіксовано: {violations}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Завершити тест?"
        message={unansweredCount > 0
          ? `Є ${unansweredCount} питань без відповіді. Ви впевнені, що хочете завершити?`
          : "Ви відповіли на всі питання. Підтвердіть завершення тесту."
        }
        confirmLabel={submitting ? 'Надсилання...' : 'Завершити тест'}
      />
    </div>
  )
}
