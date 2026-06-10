'use client'

import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import NoticeBar from '@/components/shared/NoticeBar'
import SpecialNoticePopup from '@/components/home/SpecialNoticePopup'
import ScrollToTop from '@/components/shared/ScrollToTop'
import { useRouterStore, isAdminRoute } from '@/store/router'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { currentRoute } = useRouterStore()
  const isAdmin = isAdminRoute(currentRoute)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className={isAdmin ? 'h-screen' : 'min-h-screen flex flex-col'}>
        {!isAdmin && <Header />}
        {!isAdmin && <NoticeBar />}

        <main className={isAdmin ? 'h-full' : 'flex-1 pt-16 pb-24 md:pb-8 mb-8'}>
          {children}
        </main>

        {!isAdmin && <Footer />}
        {!isAdmin && <BottomNav />}
        {!isAdmin && <SpecialNoticePopup />}
        <ScrollToTop />
      </div>
    </div>
  )
}
