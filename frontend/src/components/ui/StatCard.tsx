import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'primary' | 'green' | 'yellow' | 'blue' | 'red'
  subtitle?: string
}

const gradients: Record<string, string> = {
  primary: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
  green:   'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  yellow:  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  blue:    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  red:     'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
}

const shadows: Record<string, string> = {
  primary: '0 8px 24px rgba(124,58,237,0.35)',
  green:   '0 8px 24px rgba(16,185,129,0.35)',
  yellow:  '0 8px 24px rgba(245,158,11,0.35)',
  blue:    '0 8px 24px rgba(59,130,246,0.35)',
  red:     '0 8px 24px rgba(244,63,94,0.35)',
}

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }: Props) {
  const bg = gradients[color] || gradients.primary
  const shadow = shadows[color] || shadows.primary

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden text-white"
      style={{ background: bg, boxShadow: shadow }}>
      {/* Decorative circles */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-1 -top-8 w-14 h-14 rounded-full bg-white/[0.07] pointer-events-none" />

      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-white/70 text-sm font-medium leading-none mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-white leading-none">{value}</p>
        {subtitle && <p className="text-white/50 text-xs mt-1.5">{subtitle}</p>}
      </div>
    </div>
  )
}
