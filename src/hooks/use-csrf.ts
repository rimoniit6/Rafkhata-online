'use client'

import { useState, useEffect, useCallback } from 'react'

const CSRF_HEADER = 'x-csrf-token'

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCsrfToken()
  }, [])

  const fetchCsrfToken = useCallback(async () => {
    try {
      const res = await fetch('/api/csrf-token', { method: 'GET', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          setToken(data.token)
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    await fetchCsrfToken()
  }, [])

  return { token, loading, refreshToken }
}

export function withCsrfHeaders(token: string | null, headers: Record<string, string> = {}): Record<string, string> {
  if (!token) return headers
  return { ...headers, [CSRF_HEADER]: token }
}