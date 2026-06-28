'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const CSRF_HEADER = 'x-csrf-token'

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const tokenRef = useRef<string | null>(null)

  const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/csrf-token', { method: 'GET', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
          tokenRef.current = data.token
          return data.token
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
    return null
  }, [])

  useEffect(() => {
    fetchCsrfToken()
  }, [fetchCsrfToken])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    return fetchCsrfToken()
  }, [fetchCsrfToken])

  return { token, loading, refreshToken, tokenRef }
}

export function withCsrfHeaders(token: string | null, headers: Record<string, string> = {}): Record<string, string> {
  if (!token) return headers
  return { ...headers, [CSRF_HEADER]: token }
}