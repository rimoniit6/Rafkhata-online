'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const THRESHOLD = 300

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > THRESHOLD)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="পৃষ্ঠার উপরে যান"
      className={cn(
        'fixed z-50 bottom-6 right-4 md:bottom-8 md:right-8',
        'flex items-center justify-center',
        'size-11 md:size-12 rounded-full',
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
        'text-white shadow-lg shadow-emerald-600/25',
        'hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-110',
        'active:scale-95 transition-all duration-200',
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <ArrowUp className="size-5 md:size-5" />
    </button>
  )
}
