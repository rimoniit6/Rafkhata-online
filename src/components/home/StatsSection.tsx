'use client'

import { usePublicStats,useSiteConfig } from '@/hooks/use-metadata'
import { FileText,HelpCircle,Loader2,Users,Video } from 'lucide-react'
import { useEffect,useRef,useState } from 'react'

function formatBengali(count: number): string {
  if (count === 0) return '০'
  return new Intl.NumberFormat('bn-BD').format(count)
}

interface StatItem {
  icon: React.ElementType
  value: number
  label: string
  bengaliValue: string
}

function AnimatedCounter({ value, bengaliValue }: { value: number; bengaliValue: string }) {
  const [_count, setCount] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const stepValue = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += stepValue
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-bold text-white">
      {isInView && value > 0 ? bengaliValue : '০'}
      {value > 0 ? '+' : ''}
    </span>
  )
}

export default function StatsSection() {
  const { stats, loading } = usePublicStats()
  const { config } = useSiteConfig()

  const statItems: StatItem[] = stats
    ? [
        { icon: Users, value: stats.students, label: 'শিক্ষার্থী', bengaliValue: formatBengali(stats.students) },
        { icon: HelpCircle, value: stats.mcqs, label: 'MCQ প্রশ্ন', bengaliValue: formatBengali(stats.mcqs) },
        { icon: Video, value: stats.lectures, label: 'লেকচার', bengaliValue: formatBengali(stats.lectures) },
        { icon: FileText, value: stats.exams, label: 'পরীক্ষা', bengaliValue: formatBengali(stats.exams) },
      ]
    : []

  // Don't show section if no data
  if (!loading && statItems.every((s) => s.value === 0)) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {config?.homepageStatsTitle || 'আমাদের অর্জন'}
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            {config?.homepageStatsSubtitle || config?.statsSubtitle || 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/70" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {statItems.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={i}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mb-2">
                    <AnimatedCounter
                      value={stat.value}
                      bengaliValue={stat.bengaliValue}
                    />
                  </div>
                  <p className="text-white/80 text-sm sm:text-base">{stat.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
