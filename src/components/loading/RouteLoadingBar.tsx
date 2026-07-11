'use client'

import { useEffect, useState, useRef } from 'react'
import { useNavigationLoader } from '@/store/navigation-loader'

const SHOW_THRESHOLD_MS = 150

export function RouteLoadingBar() {
  const isLoading = useNavigationLoader((s) => s.isLoading)
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShow(true), SHOW_THRESHOLD_MS)
    } else {
      setShow(false)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isLoading])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] overflow-hidden"
      style={{ opacity: show ? 1 : 0, transition: 'opacity 0.2s ease-out', pointerEvents: 'none' }}
    >
      <div className="relative h-full w-full bg-emerald-500/20">
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400"
          style={{
            animation: show ? 'route-progress 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    </div>
  )
}
