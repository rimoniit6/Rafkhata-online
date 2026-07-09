'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLoading } from '@/hooks/useLoading'
import type { LoadingOptions } from '@/types/loading'

interface RouteLoaderProps {
  loadingOptions?: LoadingOptions
}

export function RouteLoader({ loadingOptions }: RouteLoaderProps) {
  const { startLoading, stopLoading } = useLoading()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loadingIdRef = useRef<string | null>(null)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    const prevPath = prevPathRef.current

    if (currentPath !== prevPath) {
      if (loadingIdRef.current) {
        stopLoading(loadingIdRef.current)
      }

      const id = startLoading({
        priority: 'high',
        message: 'Loading page...',
        ...loadingOptions,
      })
      loadingIdRef.current = id
      prevPathRef.current = currentPath

      // Use requestAnimationFrame to wait for the next paint,
      // then stop once the new route has loaded
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (loadingIdRef.current) {
            stopLoading(loadingIdRef.current)
            loadingIdRef.current = null
          }
        })
      })

      return () => cancelAnimationFrame(raf)
    }
  }, [pathname, searchParams, startLoading, stopLoading, loadingOptions])

  return null
}
