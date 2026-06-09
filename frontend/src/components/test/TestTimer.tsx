import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { tickTimer, setTimer } from '@/app/slices/sessionSlice'
import { sessionsApi } from '@/api/sessionsApi'

interface Props {
  sessionId: string
  onTimeUp: () => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const SIZE = 56
const STROKE = 4
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function TestTimer({ sessionId, onTimeUp }: Props) {
  const dispatch = useAppDispatch()
  const remaining = useAppSelector(s => s.session.remainingSeconds)
  const total = useAppSelector(s => s.session.totalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const sync = async () => {
      try {
        const data = await sessionsApi.getRemaining(sessionId)
        dispatch(setTimer({ remaining: data.remaining_seconds, total: data.total_seconds }))
      } catch {}
    }
    sync()
    syncRef.current = setInterval(sync, 30000)

    intervalRef.current = setInterval(() => {
      dispatch(tickTimer())
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (syncRef.current) clearInterval(syncRef.current)
    }
  }, [sessionId, dispatch])

  useEffect(() => {
    if (remaining !== null && remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (syncRef.current) clearInterval(syncRef.current)
      onTimeUp()
    }
  }, [remaining, onTimeUp])

  if (remaining === null) return null

  const pct = total ? Math.max(0, (remaining / total) * 100) : 100
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE
  const isLow = remaining < 60
  const isMedium = remaining < 300

  const ringColor = isLow ? '#ef4444' : isMedium ? '#f59e0b' : '#9ca3af'
  const textColor = isLow
    ? 'text-red-600 dark:text-red-400'
    : isMedium
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-gray-700 dark:text-gray-300'

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
          style={isLow ? { filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' } : undefined}
        />
      </svg>
      <span className={`absolute font-mono font-bold text-xs ${textColor}`}>
        {formatTime(remaining)}
      </span>
    </div>
  )
}
