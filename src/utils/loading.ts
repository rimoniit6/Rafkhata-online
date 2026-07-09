import type { LoadingMessage, LoadingPriority } from '@/types/loading'

export const LOADING_MESSAGES: LoadingMessage[] = [
  { text: 'Preparing Your Learning Experience...', duration: 3000 },
  { text: 'Loading Courses...', duration: 2500 },
  { text: 'Loading Study Materials...', duration: 2500 },
  { text: 'Preparing MCQ Practice...', duration: 3000 },
  { text: 'Getting Everything Ready...', duration: 2000 },
  { text: 'Almost Ready...', duration: 2000 },
]

export const ANIMATION_DURATIONS = {
  bookFadeIn: 600,
  coverOpen: 800,
  pageFlip: 1200,
  glowTransition: 2000,
  messageFade: 400,
  overlayFade: 500,
  progressRing: 600,
  particleFloat: 3000,
  floatCycle: 4000,
} as const

export const PROGRESS_SPEED: Record<LoadingPriority, number> = {
  critical: 8,
  high: 6,
  medium: 4,
  low: 2,
}

export const PROGRESS_CONFIG = {
  maxFakeProgress: 90,
  targetFakeProgress: 85,
  incrementInterval: 200,
  slowDownThreshold: 70,
  completeDelay: 300,
  slowDownMultiplier: 0.3,
} as const

export const PRIORITY_ORDER: Record<LoadingPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export const COLORS = {
  primary: '#10B981',
  secondary: '#2563EB',
  accent: '#4F46E5',
} as const

export const THRESHOLDS = {
  progressComplete: 100,
  minProgress: 0,
  maxProgress: 100,
} as const

export const MAX_PARTICLES = 6
export const PARTICLE_FLOAT_DURATION = 3000
export const MESSAGE_INTERVAL = 3000
export const GLOW_DURATION = 2000
export const PAGE_COUNT = 8
