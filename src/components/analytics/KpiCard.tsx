'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  change?: number
  changeLabel?: string
  color?: string
  bg?: string
  format?: 'currency' | 'percent' | 'number'
  onClick?: () => void
  loading?: boolean
}

function AnimatedNumber({ value, format }: { value: number; format?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    const duration = 800
    const startTime = performance.now()
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.floor(eased * end)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  if (format === 'currency') return <>{`৳${display.toLocaleString('bn-BD')}`}</>
  if (format === 'percent') return <>{`${display}%`}</>
  return <>{display.toLocaleString('bn-BD')}</>
}

export default function KpiCard({
  title, value, subtitle, icon: Icon, change, changeLabel, color = 'text-emerald-600 dark:text-emerald-400',
  bg = 'bg-emerald-50 dark:bg-emerald-950/30', format, onClick, loading,
}: KpiCardProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0 : value
  const ChangeIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus
  const trendColor = change && change > 0 ? 'text-emerald-600' : change && change < 0 ? 'text-red-600' : 'text-muted-foreground'

  if (loading) {
    return (
      <Card className="animate-pulse border-border/50">
        <CardContent className="p-5"><div className="space-y-3"><div className="h-4 w-24 bg-muted rounded" /><div className="h-8 w-32 bg-muted rounded" /><div className="h-3 w-20 bg-muted rounded" /></div></CardContent>
      </Card>
    )
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} onClick={onClick} className={cn(onClick && 'cursor-pointer')}>
      <Card className="hover:shadow-md transition-all duration-300 border-border/50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{title}</p>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">
                {typeof value === 'string' ? value : <AnimatedNumber value={numericValue} format={format} />}
              </p>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              {(change !== undefined || changeLabel) && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  {change !== undefined && <ChangeIcon className={cn('h-3 w-3', trendColor)} />}
                  {change !== undefined && (
                    <span className={cn('text-xs font-medium', trendColor)}>{change > 0 ? '+' : ''}{change}%</span>
                  )}
                  {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
                </div>
              )}
            </div>
            {Icon && (
              <div className={cn('p-3 rounded-xl shrink-0', bg)}>
                <Icon className={cn('h-5 w-5 md:h-5 w-5', color)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
