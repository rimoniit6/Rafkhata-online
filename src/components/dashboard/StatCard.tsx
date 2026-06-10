'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileQuestion, Users, BookOpen, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color?: string
  bg?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
  onClick?: () => void
}

const iconMap: Record<string, React.ElementType> = {
  Users,
  FileQuestion,
  BookOpen,
  DollarSign,
  Clock,
  TrendingUp,
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'text-emerald-600 dark:text-emerald-400',
  bg = 'bg-emerald-50 dark:bg-emerald-950/30',
  trend,
  className,
  onClick
}: StatCardProps) {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] || Users : icon

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn('cursor-pointer', onClick && 'hover:shadow-lg')}
    >
      <Card className={cn("hover:shadow-md transition-all duration-300", className)}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 pt-1">
                  <TrendingUp className={cn("h-3 w-3", trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')} />
                  <span className={cn("text-xs", trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {trend.value >= 0 ? '+' : ''}{trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl", bg)}>
              <IconComponent className={cn("h-5 w-5 md:h-6 md:w-6", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
