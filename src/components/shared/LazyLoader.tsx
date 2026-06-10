'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyLoaderProps {
  children: React.ReactNode
  loading: boolean
  height?: string
  className?: string
}

export default function LazyLoader({ 
  children, 
  loading, 
  height = 'h-96',
  className = ''
}: LazyLoaderProps) {
  if (!loading) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`space-y-4 ${className}`}
    >
      <Skeleton className={`w-full ${height}`} />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className={`w-full ${height}`} />
    </motion.div>
  )
}
