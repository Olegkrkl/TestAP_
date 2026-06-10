import { useEffect, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  percent: number
  size?: number
  strokeWidth?: number
  passed?: boolean
  animate?: boolean
}

export default function ResultCircle({ percent, size = 160, strokeWidth = 12, passed, animate = false }: Props) {
  const [started, setStarted] = useState(false)
  const animatedPercent = useCountUp(Math.round(percent), 1200, started && animate)
  const displayPercent = animate ? animatedPercent : Math.round(percent)

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setStarted(true), 100)
      return () => clearTimeout(t)
    }
  }, [animate])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayPercent / 100) * circumference

  const gradientId = `progress-grad-${Math.round(percent)}`

  const fromColor = passed === false ? '#f59e0b' : percent >= 80 ? '#7c3aed' : percent >= 60 ? '#f59e0b' : '#f43f5e'
  const toColor   = passed === false ? '#fb923c' : percent >= 80 ? '#10b981' : percent >= 60 ? '#d97706' : '#e11d48'

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={passed ? { filter: 'drop-shadow(0 0 24px rgba(124,58,237,0.5))' } : undefined}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">{displayPercent}%</span>
      </div>
    </div>
  )
}
