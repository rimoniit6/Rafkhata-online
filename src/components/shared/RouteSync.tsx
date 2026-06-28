'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouterStore } from '@/store/router'
import { parseUrl } from '@/lib/urls'

function RouteSyncInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastUrlRef = useRef('')

  useEffect(() => {
    const qs = searchParams?.toString()
    const currentUrl = pathname + (qs ? '?' + qs : '')
    if (currentUrl === lastUrlRef.current) return
    lastUrlRef.current = currentUrl

    const parsed = parseUrl(pathname, searchParams ?? undefined)
    if (parsed) {
      const { currentRoute, params } = useRouterStore.getState()
      const skip =
        currentRoute === parsed.route &&
        JSON.stringify(params) === JSON.stringify(parsed.params)

      if (!skip) {
        const merged = { ...useRouterStore.getState().params, ...parsed.params }
        useRouterStore.getState().setRoute(parsed.route, merged)
      }
    }
  }, [pathname, searchParams])

  return null
}

export default function RouteSync() {
  return (
    <Suspense fallback={null}>
      <RouteSyncInner />
    </Suspense>
  )
}
