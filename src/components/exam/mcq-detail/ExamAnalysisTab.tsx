import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { memo } from 'react'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Crown,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { WeaknessData } from '@/components/exam/mcq-exam-detail-utils'

interface ExamAnalysisTabProps {
  purchased: boolean
  weakness: WeaknessData | null
  weaknessLoading: boolean
}

function ExamAnalysisTab({
  purchased,
  weakness,
  weaknessLoading,
}: ExamAnalysisTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {!purchased ? (
        <Card className="p-6 text-center">
          <Crown className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            দুর্বলতা বিশ্লেষণ দেখতে প্যাকেজটি কিনুন
          </p>
        </Card>
      ) : weaknessLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : !weakness || weakness.overallStats.totalExams === 0 ? (
        <Card className="p-6 text-center">
          <Target className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            দুর্বলতা বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করুন
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-emerald-200/50 dark:border-emerald-800/30">
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Award className="size-4 text-emerald-500" />
                সামগ্রিক পরিসংখ্যান
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="text-2xl font-bold text-emerald-600">
                    {toBengaliNumerals(weakness.overallStats.totalExams)}
                  </div>
                  <p className="text-xs text-muted-foreground">পরীক্ষা দিয়েছেন</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20">
                  <div className="text-2xl font-bold text-teal-600">
                    {toBengaliNumerals(weakness.overallStats.avgScore)}%
                  </div>
                  <p className="text-xs text-muted-foreground">গড় স্কোর</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="text-2xl font-bold text-emerald-500">
                    {toBengaliNumerals(weakness.overallStats.totalCorrect)}
                  </div>
                  <p className="text-xs text-muted-foreground">সঠিক উত্তর</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
                  <div className="text-2xl font-bold text-destructive">
                    {toBengaliNumerals(weakness.overallStats.totalWrong)}
                  </div>
                  <p className="text-xs text-muted-foreground">ভুল উত্তর</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {weakness.subjectWise.length > 0 && (
            <Card className="border-emerald-200/50 dark:border-emerald-800/30">
              <CardContent className="p-5">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="size-4 text-emerald-500" />
                  বিষয়ভিত্তিক সঠিকতা
                </h4>
                <div className="space-y-3">
                  {weakness.subjectWise.map((subject) => (
                    <div key={subject.subjectId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{subject.subjectName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {toBengaliNumerals(subject.totalCorrect)}/{toBengaliNumerals(subject.totalCorrect + subject.totalWrong)}
                          </span>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              subject.accuracy >= 70
                                ? 'text-emerald-600'
                                : subject.accuracy >= 40
                                ? 'text-amber-600'
                                : 'text-destructive'
                            )}
                          >
                            {toBengaliNumerals(subject.accuracy)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            subject.accuracy >= 70
                              ? 'bg-emerald-500'
                              : subject.accuracy >= 40
                              ? 'bg-amber-500'
                              : 'bg-destructive'
                          )}
                          style={{ width: `${subject.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {weakness.chapterWise.length > 0 && (
            <Card className="border-emerald-200/50 dark:border-emerald-800/30">
              <CardContent className="p-5">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="size-4 text-emerald-500" />
                  অধ্যায়ভিত্তিক সঠিকতা
                  <span className="text-xs text-muted-foreground font-normal">
                    (দুর্বল থেকে শক্তিশালী)
                  </span>
                </h4>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-1 pr-4">
                    {weakness.chapterWise.map((chapter, idx) => {
                      const barColor = chapter.accuracy >= 70
                        ? 'bg-emerald-500'
                        : chapter.accuracy >= 40
                        ? 'bg-amber-500'
                        : 'bg-destructive'
                      const textColor = chapter.accuracy >= 70
                        ? 'text-emerald-600'
                        : chapter.accuracy >= 40
                        ? 'text-amber-600'
                        : 'text-destructive'

                      return (
                        <Collapsible key={chapter.chapterId} defaultOpen={idx < 3}>
                          <CollapsibleTrigger asChild>
                            <button className="w-full text-left py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  {idx < 3 && (
                                    <TrendingDown className="size-3.5 text-destructive shrink-0" />
                                  )}
                                  {idx >= 3 && idx < weakness.chapterWise.length - 2 && (
                                    <TrendingUp className="size-3.5 text-amber-500 shrink-0" />
                                  )}
                                  {idx >= weakness.chapterWise.length - 2 && (
                                    <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                                  )}
                                  <span className="text-sm font-medium line-clamp-1">{chapter.chapterName}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-xs text-muted-foreground">
                                    {toBengaliNumerals(chapter.totalCorrect)}/{toBengaliNumerals(chapter.totalCorrect + chapter.totalWrong)}
                                  </span>
                                  <span className={cn('text-sm font-bold', textColor)}>
                                    {toBengaliNumerals(chapter.accuracy)}%
                                  </span>
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-500', barColor)}
                                  style={{ width: `${chapter.accuracy}%` }}
                                />
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-7 py-2 text-xs text-muted-foreground space-y-1">
                              <div className="flex justify-between">
                                <span>সঠিক: <span className="text-emerald-600 font-medium">{toBengaliNumerals(chapter.totalCorrect)}</span></span>
                                <span>ভুল: <span className="text-destructive font-medium">{toBengaliNumerals(chapter.totalWrong)}</span></span>
                              </div>
                              <div className="flex justify-between">
                                <span>মোট প্রশ্ন: {toBengaliNumerals(chapter.totalCorrect + chapter.totalWrong)}</span>
                                <span>সঠিকতা: <span className={cn('font-medium', textColor)}>{toBengaliNumerals(chapter.accuracy)}%</span></span>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default memo(ExamAnalysisTab)