'use client'

import { memo } from 'react'
import { Trophy, ClipboardCheck, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ExamResultData {
  id: string
  subject: string
  score: number
  total: number
  date: string
}

interface ExamsSectionProps {
  recentExams: ExamResultData[]
  onHistoryClick: () => void
  onResultClick?: (resultId: string) => void
}

function ExamsSectionComponent({ recentExams, onHistoryClick, onResultClick }: ExamsSectionProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 cursor-pointer hover:shadow-md transition-all"
        onClick={onHistoryClick}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0">
            <ClipboardCheck className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">MCQ এক্সাম প্যাকেজ হিস্টোরি</p>
            <p className="text-xs text-muted-foreground mt-0.5">আপনার সকল এক্সাম প্যাকেজের ফলাফল ও বিশ্লেষণ</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/40 dark:to-pink-900/40">
          <Trophy className="size-4 text-rose-600 dark:text-rose-400" />
        </div>
        সাম্প্রতিক পরীক্ষার ফলাফল
      </h3>
      {recentExams.length === 0 ? (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400 opacity-40" />
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 flex items-center justify-center mb-4">
              <Trophy className="size-8 text-rose-400 dark:text-rose-500" />
            </div>
            <p className="font-semibold text-lg">কোনো পরীক্ষা দেননি</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentExams.map((exam) => {
            const isGood = (exam.score / exam.total) >= 0.7
            return (
              <Card key={exam.id} className="border-0 shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => onResultClick?.(exam.id)}>
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-xl shrink-0 shadow-sm',
                    isGood
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40'
                      : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                  )}>
                    <Trophy className={cn('size-5', isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{exam.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(exam.date)}</p>
                    <div className="flex items-center gap-2.5 mt-2.5">
                      <Progress value={(exam.score / exam.total) * 100} className={cn(
                        'h-2 flex-1',
                        isGood
                          ? '[&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500'
                          : '[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500'
                      )} />
                      <span className={cn('text-xs font-bold min-w-[3rem] text-right', isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                        {exam.score}/{exam.total}
                      </span>
                    </div>
                  </div>
                  <Badge className={cn(
                    'text-xs gap-1',
                    isGood
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/30'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/30'
                  )}>
                    {isGood ? <CheckCircle2 className="size-3" /> : <TrendingUp className="size-3" />}
                    {Math.round((exam.score / exam.total) * 100)}%
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const ExamsSection = memo(ExamsSectionComponent)
