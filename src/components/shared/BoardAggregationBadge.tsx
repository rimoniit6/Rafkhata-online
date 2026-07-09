'use client'

import { Layers, MapPin, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BoardAggregationBadgeProps {
  boards?: string[]
  years?: string[]
  boardLabel?: string
  yearLabel?: string
  boardColor?: string
  singleBoard?: string | null
  singleYear?: string | null
}

export function BoardAggregationBadge({ boards, boardLabel, yearLabel, singleBoard, singleYear }: BoardAggregationBadgeProps) {
  if (boards && boardLabel && yearLabel) {
    return (
      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1 leading-tight max-w-[260px]">
        <Layers className="h-3 w-3 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground/80">{boardLabel}</div>
          <div className="truncate">{yearLabel}</div>
        </div>
      </div>
    )
  }

  if (boards && boardLabel) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 max-w-[220px]">
        <Layers className="h-2.5 w-2.5 shrink-0" />
        <span className="truncate">{boardLabel}</span>
      </Badge>
    )
  }

  return (
    <>
      {singleBoard && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
          <MapPin className="h-2.5 w-2.5" />
          {singleBoard.charAt(0).toUpperCase() + singleBoard.slice(1)}
        </Badge>
      )}
      {singleYear && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
          <Calendar className="h-2.5 w-2.5" />{singleYear}
        </Badge>
      )}
    </>
  )
}
