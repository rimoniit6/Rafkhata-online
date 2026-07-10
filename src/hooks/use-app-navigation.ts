'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useRouterStore, type RoutePath, type RouteParams } from '@/store/router'
import { routeToUrl } from '@/lib/urls'

export function useAppNavigation() {
  const router = useRouter()
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const updateParams = useRouterStore((s) => s.updateParams)

  const routerRef = useRef(router)

  useEffect(() => {
    routerRef.current = router
  }, [router])

  // Set _onNavigate synchronously so it is always available when navigate() fires.
  // Using useEffect created a window where _onNavigate was null (between cleanup and
  // re-setup), which silently swallowed sidebar clicks.
  useRouterStore.setState({
    _onNavigate: (route: RoutePath, params: RouteParams) => {
      const url = routeToUrl(route, params)
      routerRef.current.push(url)
    },
  })

  // On unmount, replace with a no-op instead of null so the store never has to
  // null-check _onNavigate.  If the bridge remounts the real callback overwrites
  // this immediately.
  useEffect(() => {
    return () => {
      useRouterStore.setState({ _onNavigate: () => {} })
    }
  }, [])

  const nav = useCallback(
    (route: RoutePath, params?: RouteParams) => {
      navigate(route, params)
    },
    [navigate],
  )

  return { navigate: nav, goBack, updateParams }
}
