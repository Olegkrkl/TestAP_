import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, BarChart2, Clock, Shield, Users, GraduationCap, Zap, Star } from 'lucide-react'
import HeroBackground from './HeroBackground'
import HeroDashboardMock from './HeroDashboardMock'
import TypewriterText from './TypewriterText'
import SocialProofBar from './SocialProofBar'

function useCountUp(target: number, duration = 1500, shouldStart = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!shouldStart) return
    let start = 0
    const steps = 60
    const increment = target / steps
    const interval = duration / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration, shouldStart])
  return count
}

function StatItem({ value, label, numeric }: { value: string; label: string; numeric?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const count = useCountUp(numeric ?? 0, 1400, visible && !!numeric)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-display font-extrabold text-primary-600 dark:text-primary-400">
        {numeric && visible ? count : value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="text-gray-900 dark:text-gray-100">
      {/* Hero */}
      <section className="relative overflow-hidden text-white py-24 lg:py-32 px-4"
        style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 35%, #1e1b4b 100%)' }}>
        <HeroBackground />

        <div className="max-w-6xl mx-auto relative lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Zap className="w-4 h-4 text-amber-400" />
              Інтелектуальна платформа тестування
            </div>
            <h1 className="text-5xl sm:text-6xl font-display font-extrabold mb-6 leading-tight">
              Тестуйте знання<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #c4b5fd, #6ee7b7)' }}>
                розумно та ефективно
              </span>
            </h1>
            <p className="text-xl text-white/75 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Платформа для створення, призначення та проходження тестів з{' '}
              <TypewriterText
                phrases={[
                  'аналітикою в реальному часі',
                  'гейміфікацією',
                  'захистом від шахрайства',
                ]}
                className="text-emerald-300 font-medium"
              />
            </p>
            <SocialProofBar />
            <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap">
              <Link to="/register"
                className="px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 transition shadow-xl text-lg"
                style={{ boxShadow: '0 8px 32px rgba(255,255,255,0.2)' }}>
                Почати безкоштовно
              </Link>
              <Link to="/login"
                className="px-8 py-4 text-white font-semibold rounded-2xl transition text-lg"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Увійти
              </Link>
            </div>
          </div>

          <div className="mt-16 lg:mt-0 hidden sm:block">
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-[#0f0a1e] py-12 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <StatItem value="7" label="типів питань" numeric={7} />
          <StatItem value="∞" label="спроб практики" />
          <StatItem value="100%" label="серверний таймер" />
          <StatItem value="UA/EN" label="мови інтерфейсу" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#f5f3ff] dark:bg-[#0a0812]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-gray-900 dark:text-white">Переваги TestAP</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Все що потрібно для ефективного навчання та перевірки знань в одному місці</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card group">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white dark:bg-[#0f0a1e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-gray-900 dark:text-white">Як це працює?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Зареєструйтесь', desc: 'Оберіть роль — студент, викладач або адміністратор' },
              { step: '2', title: 'Створіть тест', desc: 'Додайте питання різних типів, налаштуйте таймер і параметри' },
              { step: '3', title: 'Аналізуйте', desc: 'Перегляньте детальну аналітику після проходження тесту' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                  {step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-20 px-4 bg-[#f5f3ff] dark:bg-[#0a0812]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-gray-900 dark:text-white">Для кого?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, role: 'Студенти', perks: ['Проходьте тести де завгодно', 'Тренувальні тести без оцінки', 'Відстежуйте свій прогрес', 'Бейджі та рейтинги'] },
              { icon: Users, role: 'Викладачі', perks: ['7 типів питань', 'Детальна аналітика', 'Управління групами', 'Імпорт/Експорт'] },
              { icon: Shield, role: 'Адміністратори', perks: ['Управління користувачами', 'Статистика платформи', 'Контроль груп', 'Повний доступ'] },
            ].map(({ icon: Icon, role, perks }) => (
              <div key={role} className="card">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-3 text-gray-900 dark:text-white">{role}</h3>
                <ul className="space-y-1.5">
                  {perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-white text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
        <div className="relative">
          <h2 className="text-3xl font-display font-bold mb-4">Готові почати?</h2>
          <p className="text-white/70 mb-8">Приєднуйтесь до студентів та викладачів на TestAP</p>
          <Link to="/register"
            className="inline-block px-10 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 transition text-lg"
            style={{ boxShadow: '0 8px 32px rgba(255,255,255,0.2)' }}>
            Зареєструватися безкоштовно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f0a1e] text-white/30 py-8 text-center text-sm border-t border-white/[0.06]">
        <p>© 2026 TestAP. Розумне тестування для освіти.</p>
      </footer>
    </div>
  )
}

const features = [
  { icon: BarChart2, title: 'Аналітика в реальному часі', desc: 'Миттєва оцінка, графіки успішності, рейтинги студентів', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { icon: Clock, title: 'Серверний таймер', desc: 'Таймер на сервері — не збивається при оновленні сторінки', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  { icon: Shield, title: 'Захист від шахрайства', desc: 'Фіксація виходу з вкладки, захист від копіювання', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  { icon: CheckCircle, title: '7 типів питань', desc: 'Одиночний вибір, drag & drop, відповідність, заповни пропуск', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  { icon: Star, title: 'Гейміфікація', desc: 'Бейджі, серії днів, рейтинги груп, прогрес-бар', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  { icon: Zap, title: 'Імпорт/Експорт', desc: 'Завантаження з .docx, .xlsx, .json — вивантаження в PDF, Excel', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
]
