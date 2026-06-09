import { useState, useEffect } from 'react'
import { Menu, Bell, Sun, Moon, Globe } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toggleSidebar, toggleTheme, setLanguage } from '@/app/slices/uiSlice'
import { setUnreadNotifications } from '@/app/slices/uiSlice'
import { useTranslation } from 'react-i18next'
import { notificationsApi } from '@/api/usersApi'
import i18n from '@/i18n/config'
import Tooltip from '@/components/ui/Tooltip'

export default function TopBar() {
  const dispatch = useAppDispatch()
  const { i18n: i18nInst } = useTranslation()
  const theme = useAppSelector(s => s.ui.theme)
  const language = useAppSelector(s => s.ui.language)
  const unread = useAppSelector(s => s.ui.unreadNotifications)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<Array<{ id: string; message: string; read: boolean; created_at: string }>>([])

  useEffect(() => {
    notificationsApi.list().then(data => {
      setNotifs(data)
      dispatch(setUnreadNotifications(data.filter((n: { read: boolean }) => !n.read).length))
    }).catch(() => {})
  }, [dispatch])

  const handleLangToggle = () => {
    const newLang = language === 'uk' ? 'en' : 'uk'
    dispatch(setLanguage(newLang))
    i18n.changeLanguage(newLang)
  }

  const handleNotifClick = async () => {
    setShowNotifs(!showNotifs)
    if (!showNotifs && unread > 0) {
      await notificationsApi.markAllRead().catch(() => {})
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
      dispatch(setUnreadNotifications(0))
    }
  }

  return (
    <header className="app-header h-16 flex items-center justify-between px-4 sm:px-6">
      <Tooltip content="Меню">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-white/[0.07] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </Tooltip>

      <div className="flex items-center gap-1">
        <Tooltip content="Мова інтерфейсу">
          <button
            onClick={handleLangToggle}
            className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-white/[0.07] transition-colors flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            <Globe className="w-4 h-4" />
            {language.toUpperCase()}
          </button>
        </Tooltip>

        <Tooltip content={theme === 'dark' ? 'Світла тема' : 'Темна тема'}>
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-primary-600" />
            }
          </button>
        </Tooltip>

        <div className="relative">
          <Tooltip content="Сповіщення">
            <button
              onClick={handleNotifClick}
              className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-white/[0.07] transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </Tooltip>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] bg-white dark:bg-[#1a0a2e] rounded-2xl overflow-hidden z-50"
              style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.18), 0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className="p-3 border-b border-primary-50 dark:border-white/[0.07]">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Сповіщення</h3>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-6">Немає сповіщень</p>
                ) : (
                  notifs.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-primary-50 dark:border-white/[0.05] last:border-0 transition-colors ${!n.read ? 'bg-primary-50 dark:bg-primary-950/40' : ''}`}>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('uk-UA')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
