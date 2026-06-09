import { motion } from 'framer-motion'
import { CheckCircle, Flame, TrendingUp, BookOpen, Award } from 'lucide-react'

export default function HeroDashboardMock() {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="rounded-2xl p-5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-violet-500/20"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/50 text-xs">Вітаємо, Олена!</p>
            <p className="text-white font-display font-bold text-lg">Панель студента</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            О
          </div>
        </div>

        <div
          className="rounded-xl p-3 mb-4 text-white text-sm flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }}
        >
          <Flame className="w-4 h-4 shrink-0" />
          <span className="font-semibold">7 днів поспіль!</span>
          <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden ml-1">
            <div className="h-full w-[70%] bg-white rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: CheckCircle, label: 'Тестів', value: '12', color: 'text-emerald-400' },
            { icon: TrendingUp, label: 'Середній бал', value: '87%', color: 'text-violet-300' },
            { icon: BookOpen, label: 'Активних', value: '3', color: 'text-amber-300' },
            { icon: Award, label: 'Бейджів', value: '4', color: 'text-blue-300' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl p-3 bg-white/[0.06] border border-white/[0.08]">
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <p className="text-white font-bold text-lg leading-none">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wide">Доступні тести</p>
          {['Математика — Модуль 3', 'Історія України', 'Англійська мова'].map((title, i) => (
            <div key={title} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/[0.05] border border-white/[0.06]">
              <span className="text-white/80 text-sm truncate">{title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${i === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
                {i === 0 ? 'Новий' : 'Відкритий'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
