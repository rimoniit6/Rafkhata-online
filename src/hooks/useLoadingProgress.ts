'use client'

import { useLoading } from './useLoading'

export function useLoadingProgress() {
  const { progress, setProgress, setMode, mode } = useLoading()

  function switchToReal() {
    setMode('real')
  }

  function switchToFake() {
    setMode('fake')
  }

  function switchToIndeterminate() {
    setMode('indeterminate')
  }

  return {
    progress,
    setProgress,
    mode,
    setMode,
    switchToReal,
    switchToFake,
    switchToIndeterminate,
  }
}
