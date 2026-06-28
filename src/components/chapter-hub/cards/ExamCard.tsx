'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import type { ExamItem } from '@/hooks/use-chapter-content'
import { cn,toBengaliNumerals } from '@/lib/utils'
import { Clock,FileQuestion,Lock,Play,Zap } from 'lucide-react'

interface ExamCardProps {
  exam: ExamItem
  index: number
  isPurchased?: boolean
  onUnlock?: () => void
  onStart?: () => void
}

export function ExamCard({ exam, index, isPurchased, onUnlock, onStart }: ExamCardProps) {
  const isLocked = exam.isPremium && !isPurchased

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <Card className="border-border/50 hover:border-border/80 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">
                  {exam.type}
                </Badge>
                <Badge className={cn(
                  'text-[10px] px-1.5 py-0 gap-1',
                  isLocked
                    ? 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                )} variant="outline">
                  {isLocked ? <><Lock className="h-2.5 w-2.5" /> Locked</> : <><Zap className="h-2.5 w-2.5" /> Free</>}
                </Badge>
              </div>
              <h4 className="font-medium text-sm sm:text-base truncate">{exam.title}</h4>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileQuestion className="h-3 w-3" />
                  {toBengaliNumerals(exam.totalQuestions)} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {exam.duration} min
                </span>
                {exam.totalMarks > 0 && (
                  <span>{toBengaliNumerals(exam.totalMarks)} Marks</span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {isLocked ? (
                <Button size="sm" variant="outline" onClick={onUnlock} className="rounded-lg text-xs h-8">
                  <Lock className="h-3 w-3 mr-1" /> Unlock
                </Button>
              ) : (
                <Button size="sm" onClick={onStart} className="rounded-lg text-xs h-8">
                  <Play className="h-3 w-3 mr-1" /> Start
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
