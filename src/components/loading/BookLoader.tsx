'use client'

import { motion } from 'framer-motion'
import { ANIMATION_DURATIONS, COLORS, PAGE_COUNT } from '@/utils/loading'

const BOOK_WIDTH = 120
const BOOK_HEIGHT = 90
const SPINE_WIDTH = 8
const PAGE_OFFSET = 2
const COVER_THICKNESS = 3

export function BookLoader() {
  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: ANIMATION_DURATIONS.bookFadeIn / 1000,
          ease: 'easeOut',
        }}
        className="relative"
      >
        {/* Floating animation wrapper */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{
            duration: ANIMATION_DURATIONS.floatCycle / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <svg
            width={BOOK_WIDTH + 20}
            height={BOOK_HEIGHT + 20}
            viewBox={`0 0 ${BOOK_WIDTH + 20} ${BOOK_HEIGHT + 20}`}
            className="drop-shadow-xl"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="coverGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} />
                <stop offset="100%" stopColor={COLORS.accent} />
              </linearGradient>
              <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(16,185,129,0.3)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.15)" />
              </filter>
            </defs>

            {/* Pages */}
            {Array.from({ length: PAGE_COUNT }, (_, i) => (
              <motion.rect
                key={`page-${i}`}
                x={10 + COVER_THICKNESS + i * PAGE_OFFSET}
                y={10 + COVER_THICKNESS + i * PAGE_OFFSET * 0.3}
                width={BOOK_WIDTH - SPINE_WIDTH - i * PAGE_OFFSET}
                height={BOOK_HEIGHT - i * PAGE_OFFSET * 0.3}
                rx={2}
                fill="url(#pageGrad)"
                initial={{ opacity: 0, rotateY: -5 }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  rotateY: [-1, 1, -1],
                }}
                transition={{
                  duration: ANIMATION_DURATIONS.pageFlip / 1000,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Glow highlight */}
            <motion.rect
              x={14 + COVER_THICKNESS}
              y={14 + COVER_THICKNESS}
              width={BOOK_WIDTH - SPINE_WIDTH - 8}
              height={BOOK_HEIGHT - 8}
              rx={2}
              fill="url(#glowGrad)"
              filter="url(#softGlow)"
              animate={{ x: [14 + COVER_THICKNESS, 30 + COVER_THICKNESS, 14 + COVER_THICKNESS] }}
              transition={{
                duration: ANIMATION_DURATIONS.glowTransition / 1000,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Back cover */}
            <motion.rect
              x={10}
              y={10}
              width={BOOK_WIDTH}
              height={BOOK_HEIGHT}
              rx={3}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth={COVER_THICKNESS}
              filter="url(#shadow)"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: [1, 0.97, 1] }}
              transition={{
                duration: ANIMATION_DURATIONS.coverOpen / 1000,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ originX: '10px' }}
            />

            {/* Front cover (slightly open) */}
            <motion.rect
              x={10}
              y={10}
              width={BOOK_WIDTH}
              height={BOOK_HEIGHT}
              rx={3}
              fill="url(#coverGrad)"
              fillOpacity={0.9}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: [1, 0.95, 1] }}
              transition={{
                duration: ANIMATION_DURATIONS.coverOpen / 1000,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ originX: '10px' }}
            />

            {/* Spine */}
            <motion.rect
              x={10}
              y={10}
              width={SPINE_WIDTH}
              height={BOOK_HEIGHT}
              rx={2}
              fill={COLORS.accent}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{
                duration: ANIMATION_DURATIONS.floatCycle / 1000,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Book lines decoration */}
            <line
              x1={10 + SPINE_WIDTH + 6}
              y1={30}
              x2={BOOK_WIDTH - 6}
              y2={30}
              stroke={COLORS.primary}
              strokeWidth={1.5}
              strokeOpacity={0.3}
              strokeLinecap="round"
            />
            <line
              x1={10 + SPINE_WIDTH + 6}
              y1={44}
              x2={BOOK_WIDTH - 6}
              y2={44}
              stroke={COLORS.primary}
              strokeWidth={1.5}
              strokeOpacity={0.3}
              strokeLinecap="round"
            />
            <line
              x1={10 + SPINE_WIDTH + 6}
              y1={58}
              x2={BOOK_WIDTH - 6}
              y2={58}
              stroke={COLORS.primary}
              strokeWidth={1.5}
              strokeOpacity={0.3}
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
