'use client'

import { BookOpen, Clock, Lock, CheckCircle2, Eye, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LectureItem } from '@/hooks/use-chapter-content'

interface LectureCardProps {
  lecture: LectureItem
  index: number
  isPurchased?: boolean
  isLocked?: boolean
  onUnlock?: () => void
  onContinue?: () => void
}

export function LectureCard({ lecture, index, isPurchased, isLocked, onUnlock, onContinue }: LectureCardProps) {
  const status = isLocked ? 'locked' : isPurchased ? 'purchased' : 'free'

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <Card className="border-border/50 hover:border-border/80 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                'p-2.5 rounded-xl shrink-0',
                status === 'free' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                status === 'purchased' ? 'bg-blue-50 dark:bg-blue-950/30' :
                'bg-amber-50 dark:bg-amber-950/30',
              )}>
                <BookOpen className={cn(
                  'h-5 w-5',
                  status === 'free' ? 'text-emerald-600 dark:text-emerald-400' :
                  status === 'purchased' ? 'text-blue-600 dark:text-blue-400' :
                  'text-amber-600 dark:text-amber-400',
                )} />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm sm:text-base truncate">{lecture.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {lecture.duration && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {lecture.duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn(
                'text-[10px] px-1.5 py-0 gap-1',
                status === 'free' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                status === 'purchased' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                status === 'locked' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
              )} variant="outline">
                {status === 'locked' ? <><Lock className="h-2.5 w-2.5" /> Locked</> :
                 status === 'purchased' ? <><CheckCircle2 className="h-2.5 w-2.5" /> Purchased</> :
                 <><Eye className="h-2.5 w-2.5" /> Free</>}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {status === 'locked' ? (
              <Button size="sm" variant="outline" onClick={onUnlock} className="rounded-lg text-xs h-8">
                <Lock className="h-3 w-3 mr-1" /> Unlock
              </Button>
            ) : (
              <Button size="sm" onClick={onContinue} className="rounded-lg text-xs h-8">
                <Play className="h-3 w-3 mr-1" /> Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
