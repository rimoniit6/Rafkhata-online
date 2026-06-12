'use client'

import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' } as const}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-edu-primary to-edu-primary-dark flex items-center justify-center shadow-xl shadow-edu-primary/20">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' } as const}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-edu-primary/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' } as const}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-edu-primary/20"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 } as const}
          />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <motion.h2
            className="text-xl font-bold text-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' } as const}
          >
            শিক্ষা বাংলা
          </motion.h2>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-edu-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                } as const}
              />
            ))}
          </div>
        </div>

        {/* Skeleton bars */}
        <div className="w-48 space-y-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-muted"
              initial={{ width: '0%' }}
              animate={{ width: `${70 + (i * 10)}%` }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.15,
                ease: 'easeInOut',
              } as const}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
