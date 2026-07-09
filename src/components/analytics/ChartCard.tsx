'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Maximize2, Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type React from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  onExpand?: () => void
  onDownload?: () => void
  onRefresh?: () => void
  loading?: boolean
  height?: number
}

export default function ChartCard({
  title,
  description,
  children,
  className,
  action,
  onExpand,
  onDownload,
  onRefresh,
  loading,
  height,
}: ChartCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm md:text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1">
          {action}
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onExpand && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onExpand}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className={cn('w-full', height ? `h-[${height}px]` : 'h-64')} />
        ) : (
          <div style={height ? { height: `${height}px` } : undefined}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
