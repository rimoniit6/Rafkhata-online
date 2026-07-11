'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Megaphone, X, ExternalLink, ChevronRight, Bell } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import type { RoutePath } from '@/store/router'
import { Button } from '@/components/ui/button'
import { useBanners, type BannerData } from '@/hooks/use-banners'

const SESSION_KEY = 'shiksha_special_notice_dismissed'

export default function SpecialNoticePopup() {
  const { data: banners = [], isLoading: loading } = useBanners()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const reopenTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const navigate = useRouterStore((s) => s.navigate)

  useEffect(() => {
    return () => {
      if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (loading || banners.length === 0) return

    const dismissedIds = sessionStorage.getItem(SESSION_KEY)
    const parsedDismissed: string[] = dismissedIds ? JSON.parse(dismissedIds) : []
    const unseenBanners = banners.filter((b) => !parsedDismissed.includes(b.id))

    if (unseenBanners.length === 0) return

    const timer = setTimeout(() => {
      const firstUnseenIdx = banners.findIndex((b) => !parsedDismissed.includes(b.id))
      setCurrentIndex(firstUnseenIdx >= 0 ? firstUnseenIdx : 0)
      setIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [banners, loading])

  const handleDismiss = useCallback(() => {
    const currentBanner = banners[currentIndex]
    if (currentBanner) {
      // Mark this specific notice as dismissed for this session
      const dismissedIds = sessionStorage.getItem(SESSION_KEY)
      const parsedDismissed: string[] = dismissedIds ? JSON.parse(dismissedIds) : []
      if (!parsedDismissed.includes(currentBanner.id)) {
        parsedDismissed.push(currentBanner.id)
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsedDismissed))
    }

    // If there are more unseen banners, show next one
    const dismissedIds = sessionStorage.getItem(SESSION_KEY)
    const parsedDismissed: string[] = dismissedIds ? JSON.parse(dismissedIds) : []
    const unseenBanners = banners.filter(b => !parsedDismissed.includes(b.id))

    if (unseenBanners.length > 0) {
      const nextIdx = banners.findIndex(b => b.id === unseenBanners[0].id)
      setCurrentIndex(nextIdx >= 0 ? nextIdx : 0)
      // Brief close and reopen animation for next notice
      setIsOpen(false)
      if (reopenTimerRef.current) clearTimeout(reopenTimerRef.current)
      reopenTimerRef.current = setTimeout(() => setIsOpen(true), 300)
    } else {
      setIsOpen(false)
    }
  }, [banners, currentIndex])

  const handleBannerClick = useCallback((banner: BannerData) => {
    // Dismiss first
    const dismissedIds = sessionStorage.getItem(SESSION_KEY)
    const parsedDismissed: string[] = dismissedIds ? JSON.parse(dismissedIds) : []
    if (!parsedDismissed.includes(banner.id)) {
      parsedDismissed.push(banner.id)
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsedDismissed))
    setIsOpen(false)

    if (!banner.link) return

    // External links open in new tab
    if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
      window.open(banner.link, '_blank', 'noopener,noreferrer')
      return
    }

    // Internal route
    const path = banner.link.replace(/^\/+/, '')
    const knownRoutes: Partial<Record<string, RoutePath>> = {
      'premium': 'premium',
      'class-list': 'class-list',
      'board-questions': 'board-questions',
      'exam-center': 'exam-center',
      'login': 'login',
      'register': 'register',
      'notices': 'notices',
      'search': 'search',
      'user-dashboard': 'user-dashboard',
    }

    if (knownRoutes[path]) {
      navigate(knownRoutes[path])
    } else if (path) {
      navigate(path as RoutePath)
    }
  }, [navigate])

  // Don't render while loading or if no banners
  if (loading || banners.length === 0) return null

  const currentBanner = banners[currentIndex]
  if (!currentBanner) return null

  const isExternal = currentBanner.link?.startsWith('http://') || currentBanner.link?.startsWith('https://')

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleDismiss}
          />

          {/* Popup Modal */}
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md relative animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Top decorative gradient strip */}
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="বন্ধ করুন"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>

                <div className="p-6 sm:p-8">
                  {/* Icon + Label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <div className="animate-bell-bounce">
                        <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <Megaphone className="h-3 w-3" />
                        বিশেষ নোটিশ
                      </span>
                    </div>
                  </div>

                  {/* Notice Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-snug pr-8">
                    {currentBanner.title}
                  </h2>

                  {/* Subtitle / Description */}
                  {currentBanner.subtitle && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 leading-relaxed">
                      {currentBanner.subtitle}
                    </p>
                  )}

                  {/* Image if exists */}
                  {currentBanner.image && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={currentBanner.image}
                        alt={currentBanner.title}
                        width={800}
                        height={400}
                        className="w-full h-auto max-h-48 object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* CTA Button */}
                  {currentBanner.link && (
                    <Button
                      onClick={() => handleBannerClick(currentBanner)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 text-base gap-2 rounded-xl"
                      size="lg"
                    >
                      {currentBanner.buttonText || 'আরও দেখুন'}
                      {isExternal ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {/* Pagination dots if multiple notices */}
                  {banners.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      {banners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`rounded-full transition-all duration-300 ${
                            idx === currentIndex
                              ? 'w-6 h-2 bg-emerald-500'
                              : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
