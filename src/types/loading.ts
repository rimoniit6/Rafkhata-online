export type LoadingPriority = 'critical' | 'high' | 'medium' | 'low'

export type LoadingMode = 'real' | 'fake' | 'indeterminate'

export interface LoadingTask {
  id: string
  priority: LoadingPriority
  message?: string
  startedAt: number
}

export interface LoadingMessage {
  text: string
  duration: number
}

export interface LoadingOptions {
  id?: string
  priority?: LoadingPriority
  message?: string
}

export interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
  priority: LoadingPriority
  mode: LoadingMode
  activeTasks: number
}

export interface LoadingContextType {
  startLoading: (options?: LoadingOptions) => string
  stopLoading: (id: string) => void
  withLoading: <T>(fn: () => Promise<T>, options?: LoadingOptions) => Promise<T>
  setProgress: (value: number) => void
  setMessage: (text: string) => void
  setMode: (mode: LoadingMode) => void
  reset: () => void
  isLoading: boolean
  progress: number
  message: string
  priority: LoadingPriority
  mode: LoadingMode
}
