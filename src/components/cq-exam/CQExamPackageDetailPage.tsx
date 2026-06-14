'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileQuestion,
  CheckCircle,
  XCircle,
  BookOpen,
  Award,
  Play,
  AlertCircle,
  Crown,
  ShoppingCart,
  Users,
  Target,
  Trophy,
  Timer,
  RefreshCw,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import SafeImage from '@/components/ui/safe-image'
import CQExamPackagePurchaseDialog from '@/components/cq-exam/CQExamPackagePurchaseDialog'

interface ExamSet {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  totalQuestions: number
  marksPerQ: number
  instructions: string | null
  status: string
  order: number
  _count: {
    questions: number
    submissions: number
  }
}

interface CQExamPackageDetail {
  id: string
  title: string
  description: string | null
  classId: string
  price: number
  originalPrice: number
  isPremium: boolean
  thumbnail: string | null
  totalSets: number
  status: string
  class: { id: string; name: string; slug: string }
  examSets: ExamSet[]
  _count: { purchases: number }
}

interface SubmissionBrief {
  id: string
  setId: string
  totalMarks: number
  obtainedMarks: number
  timeTaken: number
  status: string
  canRetake?: boolean
  set: { id: string; title: string; totalQuestions: number; totalMarks: number }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  } catch {
    return false
  }
}

function isFuture(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const scheduled = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return scheduled.getTime() > now.getTime()
  } catch {
    return false
  }
}

function isPast(dateStr: string): boolean {
  return !isToday(dateStr) && !isFuture(dateStr)
}

function getDaysUntil(dateStr: string): number {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const scheduled = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return Math.ceil((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

function getSetStatusBadge(
  set: ExamSet,
  submission?: SubmissionBrief | null
): {
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: React.ReactNode
  score?: string
} {
  if (submission) {
    switch (submission.status) {
      case 'published':
      case 'graded':
        return {
          label: 'মূল্যায়িত',
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          icon: <CheckCircle className="size-3" />,
          score: `${toBengaliNumerals(Math.round(submission.obtainedMarks))}/${toBengaliNumerals(Math.round(submission.totalMarks))}`,
        }
      case 'submitted':
        return {
          label: 'জমা দেওয়া',
          color: 'bg-amber-500',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          icon: <Clock className="size-3" />,
        }
      case 'in-progress':
        return {
          label: 'চলমান',
          color: 'bg-sky-500',
          bgColor: 'bg-sky-100 dark:bg-sky-900/30',
          textColor: 'text-sky-700 dark:text-sky-400',
          icon: <Timer className="size-3" />,
        }
    }
  }

  if (isToday(set.scheduledDate)) {
    return {
      label: 'আজ',
      color: 'bg-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: <Play className="size-3" />,
    }
  }
  if (isFuture(set.scheduledDate)) {
    const days = getDaysUntil(set.scheduledDate)
    return {
      label: days > 0 ? `${toBengaliNumerals(days)} দিন পর` : 'শীঘ্রই',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      icon: <Clock className="size-3" />,
    }
  }
  return {
    label: 'অতীত',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: <Calendar className="size-3" />,
  }
}

export default function CQExamPackageDetailPage() {
  const { params, goBack, navigate } = useRouterStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  const packageId = params.packageId || ''

  const [pkgDetail, setPkgDetail] = useState<CQExamPackageDetail | null>(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('action', 'detail')
      params.set('id', packageId)
      if (user) params.set('userId', user.id)

      const res = await fetch(`/api/cq-exam-packages?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      setPkgDetail(json.data?.package)
      setHasPurchased(json.data?.hasPurchased)
      setHasPendingPayment(json.data?.hasPendingPayment || false)
      setSubmissions(json.data?.submissions || [])
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'প্যাকেজের তথ্য লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [packageId, user, toast])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleStartExam = (setId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'লগইন করুন',
        description: 'পরীক্ষা দিতে প্রথমে লগইন করুন',
        variant: 'destructive',
      })
      navigate('login')
      return
    }
    navigate('cq-exam-viewer', { examId: setId, packageId })
  }

  const handleResumeExam = (submission: SubmissionBrief) => {
    if (submission.status === 'submitted') {
      navigate('cq-exam-result', { packageId, resultId: submission.id })
    } else {
      navigate('cq-exam-viewer', { examId: submission.setId, packageId })
    }
  }

  const handleViewResult = (submissionId: string) => {
    navigate('cq-exam-result', { packageId, resultId: submissionId })
  }

  const handleBuy = () => {
    if (!isAuthenticated) {
      toast({
        title: 'লগইন করুন',
        description: 'কেনাকাটা করতে প্রথমে লগইন করুন',
        variant: 'destructive',
      })
      navigate('login')
      return
    }
    if (!pkgDetail) return
    setPurchaseDialogOpen(true)
  }

  const getSubmissionForSet = (setId: string): SubmissionBrief | undefined => {
    return submissions.find((s) => s.setId === setId)
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-16 z-30 bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!pkgDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">প্যাকেজ খুঁজে পাওয়া যায়নি</p>
          <Button onClick={goBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {pkgDetail.title}
            </h1>
          </div>
          {pkgDetail.class && (
            <Badge
              variant="outline"
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0"
            >
              {pkgDetail.class.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 dark:border-emerald-800/30">
                  {pkgDetail.thumbnail ? (
                    <SafeImage
                      src={pkgDetail.thumbnail}
                      alt={pkgDetail.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="size-8 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {pkgDetail.title}
                  </h2>
                  {pkgDetail.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {pkgDetail.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="gap-1">
                      <FileQuestion className="size-3" />
                      {pkgDetail.examSets?.length || 0}টি সেট
                    </Badge>
                    {hasPurchased ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1">
                        <CheckCircle className="size-3" />
                        ক্রয় সম্পন্ন
                      </Badge>
                    ) : pkgDetail.isPremium && pkgDetail.price > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                        <Crown className="size-3" />
                        ৳{Math.round(pkgDetail.price)}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        ফ্রি
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {hasPendingPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
                    <Clock className="size-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">পেমেন্ট অপেক্ষমাণ</h3>
                    <p className="text-xs text-muted-foreground">
                      আপনার পেমেন্ট অ্যাডমিন যাচাইয়ের পর অ্যাক্সেস সক্রিয় হবে
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 shrink-0"
                    onClick={() => navigate('user-dashboard')}
                  >
                    <BookOpen className="size-4" />
                    ড্যাশবোর্ড দেখুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!hasPurchased && !hasPendingPayment && pkgDetail.isPremium && pkgDetail.price > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
                    <ShoppingCart className="size-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">প্যাকেজটি কিনুন</h3>
                    <p className="text-xs text-muted-foreground">
                      সকল CQ এক্সাম সেটে অংশ নিতে আলাদাভাবে কিনুন — প্রিমিয়াম/কন্টেন্ট প্যাকেজে অন্তর্ভুক্ত নয়
                    </p>
                  </div>
                  <Button
                    className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shrink-0"
                    onClick={handleBuy}
                  >
                    <Crown className="size-4" />
                    ৳{Math.round(pkgDetail.price)} কিনুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="size-5 text-emerald-500" />
              {hasPurchased ? 'এক্সাম সেটসমূহ' : 'পরীক্ষার রুটিন ও সেটসমূহ'}
            </h3>
            {!hasPurchased && pkgDetail.isPremium && pkgDetail.price > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                কেনার আগে নিচে সময়সূচি ও সেটের বিবরণ দেখে নিন
              </p>
            )}
          </div>

          {pkgDetail.examSets.length === 0 ? (
            <Card className="p-8 text-center">
              <FileQuestion className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                এখনো কোনো এক্সাম সেট যুক্ত হয়নি
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pkgDetail.examSets.map((set, idx) => {
                const submission = getSubmissionForSet(set.id)
                const badge = getSetStatusBadge(set, submission)
                const isGraded = submission?.status === 'graded' || submission?.status === 'published'
                const isInProgress = submission?.status === 'in-progress'
                const isSubmitted = submission?.status === 'submitted'

                return (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-sm">{set.title}</h4>
                              <Badge
                                className={cn(
                                  'text-[10px] px-1.5 py-0 gap-1',
                                  badge.bgColor,
                                  badge.textColor
                                )}
                              >
                                {badge.icon}
                                {badge.label}
                              </Badge>
                              {badge.score && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  {badge.score}
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
                                {set.startTime} - {set.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="size-3" />
                                {set.duration} মিনিট
                              </span>
                              <span className="flex items-center gap-1">
                                <FileQuestion className="size-3" />
                                {set._count?.questions || 0} প্রশ্ন
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

                          <div className="shrink-0">
                            {!hasPurchased && pkgDetail.isPremium && pkgDetail.price > 0 ? (
                              <Button
                                size="sm"
                                className="gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs"
                                onClick={handleBuy}
                              >
                                <Crown className="size-3" />
                                প্যাকেজ কিনুন
                              </Button>
                            ) : isGraded && submission?.canRetake ? (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs"
                                  onClick={() => handleViewResult(submission!.id)}
                                >
                                  <Trophy className="size-3" />
                                  ফলাফল
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
                                  onClick={() => handleStartExam(submission!.setId)}
                                >
                                  <RefreshCw className="size-3" />
                                  পুনরায় দিন
                                </Button>
                              </div>
                            ) : isGraded ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                onClick={() => handleViewResult(submission!.id)}
                              >
                                <Trophy className="size-3" />
                                ফলাফল দেখুন
                              </Button>
                            ) : isInProgress || isSubmitted ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
                                onClick={() => handleResumeExam(submission!)}
                              >
                                <Play className="size-3" />
                                {isInProgress ? 'চালিয়ে যান' : 'জমা হয়েছে'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs"
                                onClick={() => handleStartExam(set.id)}
                              >
                                <Play className="size-3" />
                                শুরু করুন
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {pkgDetail && (
        <CQExamPackagePurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={(open) => {
            setPurchaseDialogOpen(open)
            if (!open) fetchDetail()
          }}
          packageDetail={pkgDetail}
        />
      )}
    </div>
  )
}
