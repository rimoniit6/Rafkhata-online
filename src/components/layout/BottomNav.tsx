'use client'

import { motion } from 'framer-motion'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useNavigation } from '@/hooks/use-navigation'

export default function BottomNav() {
  const { currentRoute, navigate } = useRouterStore()
  const { isAuthenticated } = useAuthStore()
  const { bottomNav } = useNavigation()

  const visibleItems = bottomNav.filter(item => {
    if (item.isAdminOnly) return false // Don't show admin in bottom nav
    if (item.isAuthOnly && !isAuthenticated) return false
    return true
  })

  const getActiveIndex = () => {
    // Map sub-routes to their parent tab
    const routeMap: Record<string, string> = {
      'notice-detail': 'home',
      'suggestion-detail': 'suggestions',
      'class-detail': 'class-list',
      'subject-detail': 'class-list',
      'chapter-detail': 'class-list',
      'lecture-viewer': 'class-list',
      'mcq-exam': 'exam-center',
      'mcq-result': 'exam-center',
      'mcq-exam-package-list': 'exam-center',
      'mcq-exam-package-detail': 'exam-center',
      'mcq-exam-history': 'exam-center',
      'cq-viewer': 'class-list',
      'board-questions': 'home',
      'exam-center': 'exam-center',
    }
    const mappedRoute = routeMap[currentRoute] || currentRoute
    const idx = visibleItems.findIndex((item) => item.route === mappedRoute)
    return idx >= 0 ? idx : 0
  }

  const handleTabClick = (route: string) => {
    if (!isAuthenticated && (route === 'user-dashboard')) {
      navigate('login')
      return
    }
    const params = route === 'class-list' ? { scrollTarget: 'class-categories' } : undefined
    navigate(route as any, params)
  }

  const activeIndex = getActiveIndex()
  const itemWidthPercent = visibleItems.length > 0 ? 100 / visibleItems.length : 20

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-3 mb-3">
        <nav className="glass rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30 px-2 py-1.5">
          <div className="flex items-center justify-around relative">
            {/* Active Indicator Background */}
            <motion.div
              className="absolute top-0 h-full pointer-events-none"
              style={{ width: `${itemWidthPercent}%` }}
              animate={{ left: `${activeIndex * itemWidthPercent}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mx-1 my-0.5 h-[calc(100%-4px)] rounded-xl bg-edu-primary/10 dark:bg-edu-primary/20" />
            </motion.div>

            {/* Nav Items */}
            {visibleItems.map((item, index) => {
              const Icon = item.Icon
              const isActive = index === activeIndex
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabClick(item.route)}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] z-10"
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-edu-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </motion.div>
                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0.7,
                      y: isActive ? 0 : 1,
                    }}
                    className={`text-[10px] mt-0.5 font-medium transition-colors ${
                      isActive ? 'text-edu-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
