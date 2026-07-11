'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLoading } from '@/hooks/useLoading'
import { startNavigation, endNavigation } from '@/store/navigation-loader'
import type { LoadingOptions } from '@/types/loading'

const SETTLE_DELAY_MS = 300

interface RouteLoaderProps {
  loadingOptions?: LoadingOptions
}

export function RouteLoader({ loadingOptions }: RouteLoaderProps) {
  const { startLoading, stopLoading } = useLoading()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loadingIdRef = useRef<string | null>(null)
  const prevPathRef = useRef(pathname)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    const prevPath = prevPathRef.current

    if (currentPath !== prevPath) {
      if (loadingIdRef.current) {
        stopLoading(loadingIdRef.current)
      }
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current)
      }

      startNavigation()

      const id = startLoading({
        priority: 'high',
        message: 'Loading page...',
        ...loadingOptions,
      })
      loadingIdRef.current = id
      prevPathRef.current = currentPath

      // Wait for route to mount and data to settle before ending navigation
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          settleTimerRef.current = setTimeout(() => {
            endNavigation()
            if (loadingIdRef.current) {
              stopLoading(loadingIdRef.current)
              loadingIdRef.current = null
            }
          }, SETTLE_DELAY_MS)
        })
      })

      return () => {
        cancelAnimationFrame(raf)
        if (settleTimerRef.current) {
          clearTimeout(settleTimerRef.current)
        }
      }
    }
  }, [pathname, searchParams, startLoading, stopLoading, loadingOptions])

  return null
}
