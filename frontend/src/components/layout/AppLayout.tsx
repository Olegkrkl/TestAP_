import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppSelector } from '@/app/hooks'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PageBackground from '@/components/ui/PageBackground'

interface Props {
  role: 'student' | 'teacher' | 'admin'
}

export default function AppLayout({ role }: Props) {
  const sidebarOpen = useAppSelector(s => s.ui.sidebarOpen)
  const location = useLocation()

  // On mobile/tablet (<1024px) the sidebar is a fixed overlay, so the main
  // content must NOT shift to the right — otherwise it gets pushed off-screen.
  // The 260px shift only applies on desktop where the sidebar takes layout space.
  const mainShift = sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-0'

  return (
    <div className="min-h-screen flex page-shell">
      <PageBackground />
      <Sidebar role={role} />
      <div className={`flex-1 flex flex-col min-h-screen min-h-[100dvh] transition-all duration-300 ${mainShift} w-full min-w-0 relative z-10`}>
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
