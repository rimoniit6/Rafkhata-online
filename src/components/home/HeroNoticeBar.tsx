'use client'

import { useBanners,type BannerData } from '@/hooks/use-banners'
import { useRouterStore } from '@/store/router'
import type { RoutePath } from '@/store/router'
import { ChevronRight,ExternalLink,Megaphone,X } from 'lucide-react'
import { useCallback,useEffect,useState } from 'react'

export default function HeroNoticeBar() {
  const { data: banners = [], isLoading: loading } = useBanners()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const { navigate } = useRouterStore()

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1 || dismissed) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length, dismissed])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  const handleBannerClick = useCallback((banner: BannerData) => {
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
    }

    if (knownRoutes[path]) {
      navigate(knownRoutes[path])
    } else if (path) {
      navigate(path as RoutePath)
    }
  }, [navigate])

  // Don't render while loading or if no banners or dismissed
  if (loading || banners.length === 0 || dismissed) return null

  const currentBanner = banners[currentIndex]
  if (!currentBanner) return null

  const isExternal = currentBanner.link?.startsWith('http://') || currentBanner.link?.startsWith('https://')

  return (
    <div className="w-full animate-slide-down">
      <div className="bg-white/15 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10 gap-3">
            {/* Animated megaphone icon */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="animate-scale-pulse">
                <Megaphone className="h-4 w-4 text-amber-300" />
              </div>
            </div>

            {/* Rotating banner text */}
            <button
              onClick={() => handleBannerClick(currentBanner)}
              className={`flex-1 min-w-0 text-left group ${currentBanner.link ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div key={currentBanner.id} className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm text-white font-medium truncate">
                  {currentBanner.title}
                </span>
                {currentBanner.subtitle && (
                  <span className="hidden sm:inline text-xs text-white/70 truncate">
                    — {currentBanner.subtitle}
                  </span>
                )}
                {currentBanner.link && (
                  isExternal ? (
                    <ExternalLink className="h-3 w-3 text-white/50 shrink-0 group-hover:text-white/80 transition-colors" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-white/50 shrink-0 group-hover:text-white/80 transition-colors" />
                  )
                )}
              </div>
            </button>

            {/* CTA Button (if buttonText exists) */}
            {currentBanner.buttonText && (
              <button
                onClick={() => handleBannerClick(currentBanner)}
                className="hidden sm:flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs text-white font-medium transition-colors shrink-0"
              >
                {currentBanner.buttonText}
              </button>
            )}

            {/* Pagination dots */}
            {banners.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-3 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="h-3.5 w-3.5 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
