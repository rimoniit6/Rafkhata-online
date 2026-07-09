'use client'

import { Suspense } from 'react'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import NoticeBar from '@/components/shared/NoticeBar'
import SpecialNoticePopup from '@/components/home/SpecialNoticePopup'
import ScrollToTop from '@/components/shared/ScrollToTop'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useRouterStore, isAdminRoute } from '@/store/router'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const isAdmin = useRouterStore((s) => isAdminRoute(s.currentRoute))

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className={isAdmin ? 'h-screen' : 'min-h-screen flex flex-col'}>
        {!isAdmin && <Header />}
        {!isAdmin && <NoticeBar />}

        <main className={isAdmin ? 'h-full' : 'flex-1 pt-16 pb-24 md:pb-8 mb-8'}>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>

        {!isAdmin && <Footer />}
        {!isAdmin && <BottomNav />}
        {!isAdmin && <SpecialNoticePopup />}
        <ScrollToTop />
      </div>
    </div>
  )
}
