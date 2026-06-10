'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { safeArray, safePagination } from '@/lib/safe-array'

interface UseFetchOptions {
  immediate?: boolean
  onError?: (error: Error) => void
}

interface FetchState<T> {
  data: T[]
  total: number
  loading: boolean
  error: string | null
  pagination: { page: number; limit: number; total: number; totalPages: number } | undefined
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {},
  deps: unknown[] = [],
) {
  const { immediate = true } = options
  const [state, setState] = useState<FetchState<T>>({
    data: [],
    total: 0,
    loading: immediate,
    error: null,
    pagination: undefined,
  })
  const abortRef = useRef<AbortController | null>(null)

  const execute = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      const data = safeArray<T>(json.data ?? json)
      const pagination = safePagination(json)
      setState({
        data,
        total: pagination?.total ?? data.length,
        loading: false,
        error: null,
        pagination,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState(prev => ({ ...prev, loading: false, error: message }))
      if (options.onError) options.onError(err as Error)
    }
  }, [url, ...deps])

  useEffect(() => {
    if (immediate) execute()
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [execute, immediate])

  return { ...state, refetch: execute }
}

interface UseAdminDataOptions<T> {
  initialData?: T[]
  onError?: (error: Error) => void
}

export function useAdminData<T>(
  url: string,
  options: UseAdminDataOptions<T> = {},
) {
  const [data, setData] = useState<T[]>(options.initialData ?? [])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      const items = safeArray<T>(json.data ?? json)
      setData(items)
      setTotal(json.pagination?.total ?? items.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      if (options.onError) options.onError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, setData, loading, total, error, refetch: fetchData }
}
