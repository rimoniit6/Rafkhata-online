'use client'

import { create } from 'zustand'

interface NavigationLoaderState {
  isLoading: boolean
  start: () => void
  end: () => void
}

export const useNavigationLoader = create<NavigationLoaderState>((set) => ({
  isLoading: false,
  start: () => set({ isLoading: true }),
  end: () => set({ isLoading: false }),
}))

export function getIsNavigating(): boolean {
  return useNavigationLoader.getState().isLoading
}

export function startNavigation(): void {
  useNavigationLoader.getState().start()
}

export function endNavigation(): void {
  useNavigationLoader.getState().end()
}
