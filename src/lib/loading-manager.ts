import type {
  LoadingTask,
  LoadingOptions,
  LoadingPriority,
  LoadingState,
  LoadingMode,
} from '@/types/loading'
import {
  PRIORITY_ORDER,
  PROGRESS_SPEED,
  PROGRESS_CONFIG,
  THRESHOLDS,
} from '@/utils/loading'

type Listener = (state: LoadingState) => void

let taskIdCounter = 0

function generateId(): string {
  return `loading-${++taskIdCounter}-${Date.now()}`
}

function comparePriority(a: LoadingPriority, b: LoadingPriority): number {
  return PRIORITY_ORDER[a] - PRIORITY_ORDER[b]
}

export function createLoadingManager() {
  let tasks = new Map<string, LoadingTask>()
  let progress = 0
  let message = ''
  let mode: LoadingMode = 'fake'
  let fakeInterval: ReturnType<typeof setInterval> | null = null
  let completeTimeout: ReturnType<typeof setTimeout> | null = null
  const listeners = new Set<Listener>()

  function getHighestPriorityTask(): LoadingTask | null {
    let highest: LoadingTask | null = null
    for (const task of tasks.values()) {
      if (!highest || comparePriority(task.priority, highest.priority) < 0) {
        highest = task
      }
    }
    return highest
  }

  function getHighestPriority(): LoadingPriority {
    const task = getHighestPriorityTask()
    return task ? task.priority : 'low'
  }

  function getActiveMessage(): string {
    const highest = getHighestPriorityTask()
    return highest?.message ?? message
  }

  function notify() {
    const state: LoadingState = {
      isLoading: tasks.size > 0 || progress > 0,
      progress,
      message: getActiveMessage(),
      priority: getHighestPriority(),
      mode,
      activeTasks: tasks.size,
    }
    listeners.forEach((fn) => fn(state))
  }

  function startFakeProgress() {
    stopFakeProgress()
    if (mode !== 'fake') return

    fakeInterval = setInterval(() => {
      const priority = getHighestPriority()
      const speed = PROGRESS_SPEED[priority]

      if (progress < PROGRESS_CONFIG.targetFakeProgress) {
        progress = Math.min(progress + speed, PROGRESS_CONFIG.targetFakeProgress)
      } else if (progress < THRESHOLDS.maxProgress - 1) {
        progress += speed * PROGRESS_CONFIG.slowDownMultiplier
      }

      notify()
    }, PROGRESS_CONFIG.incrementInterval)
  }

  function stopFakeProgress() {
    if (fakeInterval !== null) {
      clearInterval(fakeInterval)
      fakeInterval = null
    }
  }

  function completeLoading() {
    stopFakeProgress()
    progress = THRESHOLDS.progressComplete
    notify()

    completeTimeout = setTimeout(() => {
      progress = THRESHOLDS.minProgress
      message = ''
      notify()
      completeTimeout = null
    }, PROGRESS_CONFIG.completeDelay)
  }

  function startLoading(options?: LoadingOptions): string {
    if (completeTimeout !== null) {
      clearTimeout(completeTimeout)
      completeTimeout = null
    }

    const id = options?.id || generateId()
    const task: LoadingTask = {
      id,
      priority: options?.priority || 'medium',
      message: options?.message,
      startedAt: Date.now(),
    }

    tasks.set(id, task)

    if (options?.message) message = options.message

    if (tasks.size === 1 && mode === 'fake') {
      startFakeProgress()
    }

    notify()
    return id
  }

  function stopLoading(id: string) {
    tasks.delete(id)

    if (tasks.size === 0) {
      completeLoading()
    } else {
      const highest = getHighestPriorityTask()
      if (highest?.message) message = highest.message
      notify()
    }
  }

  function withLoading<T>(
    fn: () => Promise<T>,
    options?: LoadingOptions,
  ): Promise<T> {
    const id = startLoading(options)
    return fn().finally(() => stopLoading(id))
  }

  function setProgress(value: number) {
    if (mode === 'real') {
      progress = Math.max(
        THRESHOLDS.minProgress,
        Math.min(THRESHOLDS.maxProgress, value),
      )
      if (progress >= THRESHOLDS.progressComplete) {
        stopFakeProgress()
      }
      notify()
    }
  }

  function setMessage(text: string) {
    message = text
    notify()
  }

  function setMode(newMode: LoadingMode) {
    mode = newMode
    if (newMode === 'real' || newMode === 'indeterminate') {
      stopFakeProgress()
    } else if (newMode === 'fake' && tasks.size > 0) {
      startFakeProgress()
    }
    notify()
  }

  function reset() {
    if (completeTimeout !== null) {
      clearTimeout(completeTimeout)
      completeTimeout = null
    }
    stopFakeProgress()
    tasks.clear()
    progress = THRESHOLDS.minProgress
    message = ''
    mode = 'fake'
    notify()
  }

  function subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }

  function destroy() {
    if (completeTimeout !== null) {
      clearTimeout(completeTimeout)
    }
    stopFakeProgress()
    listeners.clear()
    tasks.clear()
  }

  return {
    startLoading,
    stopLoading,
    withLoading,
    setProgress,
    setMessage,
    setMode,
    reset,
    subscribe,
    destroy,
    get state(): LoadingState {
      return {
        isLoading: tasks.size > 0 || progress > 0,
        progress,
        message: getActiveMessage(),
        priority: getHighestPriority(),
        mode,
        activeTasks: tasks.size,
      }
    },
  }
}

export type LoadingManager = ReturnType<typeof createLoadingManager>
