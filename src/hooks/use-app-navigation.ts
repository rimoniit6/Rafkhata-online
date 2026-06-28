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

  useEffect(() => {
    useRouterStore.setState({
      _onNavigate: (route: RoutePath, params: RouteParams) => {
        const url = routeToUrl(route, params)
        routerRef.current.push(url)
      },
    })
    return () => {
      useRouterStore.setState({ _onNavigate: null })
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
