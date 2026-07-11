import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { memo } from 'react'
import type {
  ExamSet,
  ExamPackageDetail,
  ExamSetStatusItem,
  ExamQuestion,
  DetailTab,
} from '@/components/exam/mcq-exam-detail-utils'
import {
  isToday,
  isPast,
  formatDate,
} from '@/components/exam/mcq-exam-detail-utils'
import {
  Calendar,
  Clock,
  Crown,
  FileQuestion,
  Medal,
  Play,
  RefreshCw,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react'

interface ExamSetListProps {
  examSets: ExamSet[]
  getSetStatusInfo: (set: ExamSet) => {
    label: string
    color: string
    bgColor: string
    textColor: string
    icon: React.ReactNode
    score?: string
  }
  examSetStatuses: ExamSetStatusItem[]
  purchased: boolean
  pkgDetail: ExamPackageDetail
  examLoading: boolean
  onStartExam: (setId: string) => void
  onViewResult: (resultId: string, setId: string) => void
  onFetchLeaderboard: (setId: string) => void
  onSetDetailTab: (tab: DetailTab) => void
  onOpenRetakeDialog: (setId: string) => void
  onOpenPurchaseDialog: () => void
  onNavigateToLogin: () => void
  isAuthenticated: boolean
  markedForReview: Record<string, boolean>
  currentQuestion: ExamQuestion | undefined
  onToggleMarkForReview: (mcqId: string) => void
}

function ExamSetList({
  examSets,
  getSetStatusInfo,
  examSetStatuses,
  purchased,
  pkgDetail,
  examLoading,
  onStartExam,
  onViewResult,
  onFetchLeaderboard,
  onSetDetailTab,
  onOpenRetakeDialog,
  onOpenPurchaseDialog,
  onNavigateToLogin,
  isAuthenticated,
  markedForReview,
  currentQuestion,
  onToggleMarkForReview,
}: ExamSetListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar className="size-5 text-emerald-500" />
        এক্সাম সেটসমূহ
      </h3>

      {examSets.length === 0 ? (
        <Card className="p-8 text-center">
          <FileQuestion className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            এখনো কোনো এক্সাম সেট যুক্ত হয়নি
          </p>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-emerald-200 dark:bg-emerald-800 hidden sm:block" />

          <div className="space-y-4">
            {examSets.map((set, idx) => {
              const statusInfo = getSetStatusInfo(set)
              const isCompleted = statusInfo.label === 'সম্পন্ন'
              const apiStatusData = examSetStatuses.find((s) => s.setId === set.id)
              const isAvailable = isToday(set.scheduledDate) || isPast(set.scheduledDate)

              return (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative sm:pl-12"
                >
                  <div className="absolute left-3.5 top-5 hidden sm:block">
                    <div
                      className={cn(
                        'size-3 rounded-full border-2 border-background',
                        statusInfo.color
                      )}
                    />
                  </div>

                  <Card className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm">{set.title}</h4>
                            <Badge
                              className={cn(
                                'text-[10px] px-1.5 py-0 gap-1',
                                statusInfo.bgColor,
                                statusInfo.textColor
                              )}
                            >
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                            {statusInfo.score && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {statusInfo.score}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(set.scheduledDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {set.duration} মিনিট
                            </span>
                            <span className="flex items-center gap-1">
                              <FileQuestion className="size-3" />
                              {set.totalQuestions} প্রশ্ন
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="size-3" />
                              {set.totalMarks} নম্বর
                            </span>
                          </div>

                          {set.instructions && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                              {set.instructions}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col gap-1.5">
                          {!purchased && pkgDetail.isPremium && pkgDetail.price > 0 ? (
                            <Button
                              size="sm"
                              className="gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  onNavigateToLogin()
                                  return
                                }
                                onOpenPurchaseDialog()
                              }}
                            >
                              <Crown className="size-3" />
                              প্যাকেজ কিনুন
                            </Button>
                          ) : isCompleted ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                onClick={() => {
                                  if (apiStatusData?.result?.id) {
                                    onViewResult(apiStatusData.result.id, set.id)
                                  } else {
                                    onStartExam(set.id)
                                  }
                                }}
                              >
                                <Trophy className="size-3" />
                                ফলাফল দেখুন
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1 text-xs"
                                onClick={() => {
                                  onSetDetailTab('leaderboard')
                                  onFetchLeaderboard(set.id)
                                }}
                              >
                                <Medal className="size-3" />
                                লিডারবোর্ড
                              </Button>
                              {apiStatusData?.allowRetake && (
                                <>
                                  {apiStatusData.retakeRequestStatus === 'approved' || apiStatusData.canRetake ? (
                                    <Button
                                      size="sm"
                                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                      onClick={() => onStartExam(set.id)}
                                    >
                                      <RotateCcw className="size-3" />
                                      পুনরায় দিন
                                    </Button>
                                  ) : apiStatusData.retakeRequestStatus === 'pending' ? (
                                    <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                      <RefreshCw className="size-3 mr-1" /> অনুরোধ অপেক্ষমাণ
                                    </Badge>
                                  ) : apiStatusData.retakeRequestStatus === 'rejected' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                      onClick={() => onOpenRetakeDialog(set.id)}
                                    >
                                      <RefreshCw className="size-3" />
                                      পুনরায় অনুরোধ
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      onClick={() => onOpenRetakeDialog(set.id)}
                                    >
                                      <RefreshCw className="size-3" />
                                      রিটেক অনুরোধ
                                    </Button>
                                  )}
                                </>
                              )}
                            </>
                          ) : isAvailable ? (
                            <Button
                              size="sm"
                              className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs"
                              disabled={examLoading}
                              onClick={() => onStartExam(set.id)}
                            >
                              <Play className="size-3" />
                              এক্সাম শুরু করুন
                            </Button>
                          ) : (
                            <Button size="sm" disabled className="text-xs">
                              শীঘ্রই খুলবে
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'gap-1.5',
                            markedForReview[currentQuestion?.mcqId || '']
                              ? 'text-amber-600 hover:text-amber-600'
                              : 'text-muted-foreground'
                          )}
                          onClick={() =>
                            currentQuestion &&
                            onToggleMarkForReview(currentQuestion.mcqId)
                          }
                        >
                          <Flag className="size-4" />
                          {markedForReview[currentQuestion?.mcqId || '']
                            ? 'পর্যালোচনার জন্য চিহ্নিত'
                            : 'পর্যালোচনার জন্য চিহ্নিত করুন'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default memo(ExamSetList)
