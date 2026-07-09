'use client'

import { BookOpen, GraduationCap, ArrowRight, Sparkles, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'

const floatingElements = [
  { Icon: BookOpen, x: '10%', y: '20%', delay: 0, size: 28 },
  { Icon: GraduationCap, x: '85%', y: '15%', delay: 1, size: 32 },
  { Icon: Star, x: '75%', y: '70%', delay: 2, size: 24 },
  { Icon: Sparkles, x: '15%', y: '75%', delay: 3, size: 26 },
  { Icon: BookOpen, x: '90%', y: '55%', delay: 4, size: 22 },
]

function formatStatValue(count: number): string {
  if (count === 0) return '০'
  return new Intl.NumberFormat('bn-BD').format(count) + '+'
}

export default function HeroSection() {
  const { navigate } = useRouterStore()
  const { stats, loading } = usePublicStats()
  const { config } = useSiteConfig()

  const heroStats = stats
    ? [
        { value: formatStatValue(stats.students), label: 'শিক্ষার্থী' },
        { value: formatStatValue(stats.mcqs), label: 'MCQ প্রশ্ন' },
        { value: formatStatValue(stats.lectures), label: 'লেকচার' },
        { value: formatStatValue(stats.exams), label: 'পরীক্ষা' },
      ]
    : []

  return (
    <section className="relative min-h-[90vh] flex flex-col overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]" />

      {/* Animated floating elements */}
      {floatingElements.map(({ Icon, x, y, delay, size }, i) => {
        const floatClass = `animate-float-${(i % 5) + 1}`
        return (
          <div
            key={i}
            className={`absolute text-white/20 pointer-events-none ${floatClass}`}
            style={{ left: x, top: y, opacity: 0.15, animationDelay: `${delay}s` }}
            aria-hidden="true"
          >
            <Icon size={size} />
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center stagger-children">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
              <Sparkles className="w-4 h-4" />
              {config?.heroBadge || 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            {config?.heroTitle || 'বাংলাদেশের সেরা'}
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
              শিক্ষা প্ল্যাটফর্ম
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            {config?.heroSubtitle || 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold text-lg px-8 h-12 shadow-lg shadow-black/20"
              onClick={() => navigate('class-list')}
            >
              শিক্ষা শুরু করুন
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold text-lg px-8 h-12 bg-transparent"
              onClick={() => navigate('premium')}
            >
              প্রিমিয়াম দেখুন
              <Sparkles className="w-5 h-5 ml-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {heroStats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 hover:bg-white/15 transition-colors animate-scale-in"
                style={{ animationDelay: `${0.8 + i * 0.1}s` }}
              >
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {loading ? (
                    <div role="status" aria-busy="true"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm text-white/75 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 50L48 45.7C96 41.3 192 32.7 288 30.8C384 29 480 34 576 41.2C672 48.3 768 57.7 864 55.8C960 54 1056 41 1152 36.7C1248 32.3 1344 36.7 1392 38.8L1440 41V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  )
}
