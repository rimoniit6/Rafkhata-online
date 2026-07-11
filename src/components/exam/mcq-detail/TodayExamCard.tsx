import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ExamSet, ExamSetStatusItem, SetStatusInfo } from '@/components/exam/mcq-exam-detail-utils'
import { formatTime } from '@/components/exam/mcq-exam-detail-utils'
import {
  Clock,
  FileQuestion,
  Play,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'

interface TodayExamCardProps {
  todaySet: ExamSet
  statusInfo: SetStatusInfo
  todayCountdown: number
  examLoading: boolean
  examSetStatuses: ExamSetStatusItem[]
  onStartExam: (setId: string) => void
  onViewResult: (resultId: string, setId: string) => void
}

function TodayExamCard({
  todaySet,
  statusInfo,
  todayCountdown,
  examLoading,
  examSetStatuses,
  onStartExam,
  onViewResult,
}: TodayExamCardProps) {
  const isCompleted = statusInfo.label === 'সম্পন্ন'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
    >
      <Card className="border-red-200 dark:border-red-800 overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 shrink-0">
              <Zap className="size-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm">আজকের পরীক্ষা</h3>
                <Badge className={cn('text-[10px] px-1.5 py-0 gap-1', statusInfo.bgColor, statusInfo.textColor)}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
                {statusInfo.score && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {statusInfo.score}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium">{todaySet.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {todaySet.startTime} - {todaySet.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="size-3" />
                  {todaySet.duration} মিনিট
                </span>
                <span className="flex items-center gap-1">
                  <FileQuestion className="size-3" />
                  {todaySet.totalQuestions} প্রশ্ন
                </span>
              </div>
              {todayCountdown > 0 && !isCompleted && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    শুরু হতে বাকি: {formatTime(todayCountdown)}
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0">
              {isCompleted ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => {
                    const apiStatus = examSetStatuses.find((s) => s.setId === todaySet.id)
                    if (apiStatus?.result?.id) {
                      onViewResult(apiStatus.result.id, todaySet.id)
                    } else {
                      onStartExam(todaySet.id)
                    }
                  }}
                >
                  <Trophy className="size-3" />
                  ফলাফল দেখুন
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs"
                  disabled={examLoading || todayCountdown > 0}
                  onClick={() => onStartExam(todaySet.id)}
                >
                  <Play className="size-3" />
                  পরীক্ষা শুরু করুন
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default memo(TodayExamCard)