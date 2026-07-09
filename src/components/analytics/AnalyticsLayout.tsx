'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import AnalyticsFilters from './AnalyticsFilters'

interface AnalyticsLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  filters?: boolean
}

export default function AnalyticsLayout({ title, description, children, filters = true }: AnalyticsLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {filters && <AnalyticsFilters />}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {children}
      </motion.div>
    </div>
  )
}
