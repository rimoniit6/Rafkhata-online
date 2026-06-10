'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTestimonials, useSiteConfig } from '@/hooks/use-metadata'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.slice(0, 2)
}

const carouselVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 100 : -100,
    opacity: 0,
  }),
}

function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: { id: string; name: string; role?: string | null; avatar?: string | null; content: string; rating: number }[]
}) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  // Auto rotate
  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const t = testimonials[current]

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={carouselVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' } as const}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 sm:p-8 text-center">
                <Quote className="w-10 h-10 text-emerald-200 dark:text-emerald-800 mx-auto mb-4" />
                  <p className="text-foreground text-lg leading-relaxed mb-6">
                    &ldquo;{(t?.content || '').replace(/<[^>]*>/g, '')}&rdquo;
                  </p>
                <div className="flex items-center justify-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (t?.rating || 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Avatar className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30">
                    <AvatarFallback className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      {t ? getInitials(t.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">
                      {t?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t?.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="p-2 rounded-full bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1)
                setCurrent(i)
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-emerald-600 dark:bg-emerald-400 w-6'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="p-2 rounded-full bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials()
  const { config } = useSiteConfig()

  // Don't show section if no testimonials from database
  if (!loading && testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageTestimonialsTitle || 'শিক্ষার্থীরা যা বলেন'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {config?.homepageTestimonialsSubtitle || 'আমাদের প্ল্যাটফর্ম ব্যবহারকারী শিক্ষার্থীদের মতামত'}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TestimonialsCarousel testimonials={testimonials} />
        )}
      </div>
    </section>
  )
}
