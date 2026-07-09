'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MAX_PARTICLES, PARTICLE_FLOAT_DURATION, COLORS } from '@/utils/loading'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  color: string
}

const particleColors = [COLORS.primary, COLORS.secondary, COLORS.accent]

function generateParticles(): Particle[] {
  return Array.from({ length: MAX_PARTICLES }, (_, i) => ({
    id: i,
    x: Math.random() * 180 - 90,
    y: Math.random() * 80 - 40,
    size: Math.random() * 3 + 1.5,
    delay: Math.random() * PARTICLE_FLOAT_DURATION,
    color: particleColors[i % particleColors.length],
  }))
}

export const Particles = memo(function Particles() {
  const particles = useMemo(() => generateParticles(), [])

  if (particles.length === 0) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, p.x, p.x * 0.5],
            y: [0, p.y, p.y * 0.8],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: PARTICLE_FLOAT_DURATION / 1000,
            delay: p.delay / 1000,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
})
