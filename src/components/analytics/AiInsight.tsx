'use client'

import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface AiInsightProps {
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  action?: string
}

const typeConfig = {
  positive: {
    icon: TrendingUp,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  negative: {
    icon: TrendingDown,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  neutral: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
}

export default function AiInsight({ type, title, description, action }: AiInsightProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex items-start gap-3 p-3 rounded-lg border', config.bg, config.border)}
    >
      <div className={cn('p-1.5 rounded-full bg-background/50', config.iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
          <p className={cn('text-sm font-medium', config.text)}>{title}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {action && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            → {action}
          </p>
        )}
      </div>
    </motion.div>
  )
}
