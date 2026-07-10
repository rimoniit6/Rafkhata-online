'use client'

import { Button } from '@/components/ui/button'
import {
Carousel,
CarouselContent,
CarouselItem,
CarouselNext,
CarouselPrevious,
type CarouselApi,
} from '@/components/ui/carousel'
import { useBanners,type BannerData } from '@/hooks/use-banners'
import { useRouterStore } from '@/store/router'
import type { RoutePath } from '@/store/router'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowRight,Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

export default function BannerCarousel() {
  const navigate = useRouterStore((s) => s.navigate)
  const { data: banners = [], isLoading: loading } = useBanners()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  // Track current slide
  const onSelect = useCallback(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
  }, [api])

  useEffect(() => {
    if (!api) return
    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, onSelect])

  // Handle banner click
  const handleBannerClick = (banner: BannerData) => {
    if (!banner.link) return

    // External links open in new tab
    if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
      window.open(banner.link, '_blank', 'noopener,noreferrer')
      return
    }

    // Internal route — normalize by removing leading slashes
    const path = banner.link.replace(/^\/+/, '')

    // Known route mapping
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
      // For unknown internal paths, try navigating directly
      navigate(path as RoutePath)
    }
  }

  // Don't render anything while loading or if no banners
  if (loading) {
    return (
      <section className="w-full bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </section>
    )
  }

  if (banners.length === 0) return null

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-fade-in-up">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: banners.length > 1,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {banners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div
                    role="button"
                    tabIndex={banner.link ? 0 : undefined}
                    className={`relative overflow-hidden rounded-2xl ${
                      banner.link ? 'cursor-pointer' : ''
                    } focus-visible:ring-2 focus-visible:ring-emerald-500`}
                    onClick={() => handleBannerClick(banner)}
                    onKeyDown={(e: React.KeyboardEvent) => { if (banner.link && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleBannerClick(banner) } }}
                  >
                    {/* Banner with image */}
                    {banner.image ? (
                      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
                        <Image
                          src={banner.image}
                          alt={banner.title}
                          fill
                          className="object-cover"
                          unoptimized
                          priority
                        />
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                        {/* Text content over image */}
                        <div className="absolute inset-0 flex items-center">
                          <div className="px-6 sm:px-10 md:px-14 max-w-xl">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                              {banner.title}
                            </h3>
                            {banner.subtitle && (
                              <p className="text-sm sm:text-base text-white/85 mb-4 line-clamp-2">
                                {banner.subtitle}
                              </p>
                            )}
                            {banner.buttonText && (
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBannerClick(banner)
                                }}
                              >
                                {banner.buttonText}
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Banner without image — gradient card */
                      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
                        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/10 rounded-full" />

                        {/* Text content */}
                        <div className="absolute inset-0 flex items-center">
                          <div className="px-6 sm:px-10 md:px-14 max-w-xl">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                              {banner.title}
                            </h3>
                            {banner.subtitle && (
                              <p className="text-sm sm:text-base text-white/85 mb-4 line-clamp-2">
                                {banner.subtitle}
                              </p>
                            )}
                            {banner.buttonText && (
                              <Button
                                size="sm"
                                className="bg-white text-emerald-700 hover:bg-white/90 font-medium shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleBannerClick(banner)
                                }}
                              >
                                {banner.buttonText}
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation arrows — only show if more than 1 banner */}
            {banners.length > 1 && (
              <>
                <CarouselPrevious className="left-2 sm:-left-4 bg-white/80 hover:bg-white border-0 shadow-lg text-emerald-700 h-9 w-9 sm:h-10 sm:w-10" />
                <CarouselNext className="right-2 sm:-right-4 bg-white/80 hover:bg-white border-0 shadow-lg text-emerald-700 h-9 w-9 sm:h-10 sm:w-10" />
              </>
            )}
          </Carousel>

          {/* Dot indicators */}
          {banners.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4" role="tablist" aria-label="স্লাইডার নেভিগেশন">
              {banners.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={current === index}
                  onClick={() => api?.scrollTo(index)}
                  className={`transition-all duration-300 rounded-full ${
                    current === index
                      ? 'w-6 h-2.5 bg-emerald-600'
                      : 'w-2.5 h-2.5 bg-emerald-600/30 hover:bg-emerald-600/50'
                  }`}
                  aria-label={`স্লাইড ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
