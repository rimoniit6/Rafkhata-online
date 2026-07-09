'use client'

import { motion } from 'framer-motion'
import { useLoading } from '@/hooks/useLoading'
import { COLORS, ANIMATION_DURATIONS } from '@/utils/loading'

const SIZE = 80
const STROKE_WIDTH = 4
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CircularProgress() {
  const { progress, mode } = useLoading()

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE
  const isIndeterminate = mode === 'indeterminate'

  return (
    <div
      className="relative flex items-center justify-center"
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Loading ${progress}%`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={isIndeterminate ? 0 : offset}
          animate={
            isIndeterminate
              ? {
                  rotate: 360,
                  strokeDashoffset: [CIRCUMFERENCE * 0.75, CIRCUMFERENCE * 0.25],
                }
              : { strokeDashoffset: offset }
          }
          transition={
            isIndeterminate
              ? {
                  rotate: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                  },
                  strokeDashoffset: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'easeInOut',
                  },
                }
              : {
                  duration: ANIMATION_DURATIONS.progressRing / 1000,
                  ease: 'easeInOut',
                }
          }
        />
      </svg>
      <span className="absolute text-sm font-semibold text-foreground tabular-nums">
        {isIndeterminate ? '∞' : `${Math.round(progress)}%`}
      </span>
    </div>
  )
}
