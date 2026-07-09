'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LOADING_MESSAGES, ANIMATION_DURATIONS } from '@/utils/loading'

export function LoadingMessages() {
  const [index, setIndex] = useState(0)

  const nextMessage = useCallback(() => {
    setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextMessage, LOADING_MESSAGES[index].duration)
    return () => clearInterval(timer)
  }, [index, nextMessage])

  return (
    <div
      className="relative h-6 flex items-center justify-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: ANIMATION_DURATIONS.messageFade / 1000,
            ease: 'easeInOut',
          }}
          className="text-sm text-muted-foreground text-center whitespace-nowrap"
        >
          {LOADING_MESSAGES[index].text}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
