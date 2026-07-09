'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { LoadingContext } from '@/context/LoadingContext'
import { createLoadingManager } from '@/lib/loading-manager'
import { LoadingOverlay } from '@/components/loading/LoadingOverlay'
import type {
  LoadingOptions,
  LoadingMode,
  LoadingContextType,
} from '@/types/loading'

interface LoadingProviderProps {
  children: React.ReactNode
}

export default function LoadingProvider({
  children,
}: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgressState] = useState(0)
  const [message, setMessageState] = useState('')
  const [priority, setPriority] = useState<LoadingContextType['priority']>('low')
  const [mode, setModeState] = useState<LoadingMode>('fake')

  const managerRef = useRef(createLoadingManager())

  useEffect(() => {
    const manager = managerRef.current
    const unsub = manager.subscribe((state) => {
      setIsLoading(state.isLoading)
      setProgressState(state.progress)
      setMessageState(state.message)
      setPriority(state.priority)
      setModeState(state.mode)
    })
    return () => {
      unsub()
      manager.destroy()
    }
  }, [])

  const startLoading = useCallback((options?: LoadingOptions): string => {
    return managerRef.current.startLoading(options)
  }, [])

  const stopLoading = useCallback((id: string) => {
    managerRef.current.stopLoading(id)
  }, [])

  const withLoading = useCallback(
    <T,>(fn: () => Promise<T>, options?: LoadingOptions): Promise<T> => {
      return managerRef.current.withLoading(fn, options)
    },
    [],
  )

  const setProgress = useCallback((value: number) => {
    managerRef.current.setProgress(value)
  }, [])

  const setMessage = useCallback((text: string) => {
    managerRef.current.setMessage(text)
  }, [])

  const setMode = useCallback((newMode: LoadingMode) => {
    managerRef.current.setMode(newMode)
  }, [])

  const reset = useCallback(() => {
    managerRef.current.reset()
  }, [])

  const contextValue = useMemo<LoadingContextType>(
    () => ({
      startLoading,
      stopLoading,
      withLoading,
      setProgress,
      setMessage,
      setMode,
      reset,
      isLoading,
      progress,
      message,
      priority,
      mode,
    }),
    [
      startLoading,
      stopLoading,
      withLoading,
      setProgress,
      setMessage,
      setMode,
      reset,
      isLoading,
      progress,
      message,
      priority,
      mode,
    ],
  )

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  )
}
