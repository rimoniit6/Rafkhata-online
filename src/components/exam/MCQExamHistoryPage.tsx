'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Trophy,
  BookOpen,
  Calendar,
  FileQuestion,
  Target,
  BarChart3,
  TrendingUp,
  Award,
  Hash,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import EmptyState from '@/components/shared/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExamResultItem {
  id: string
  userId: string
  setId: string
  answers: Record<string, string>
  totalCorrect: number
  totalWrong: number
  totalSkipped: number
  marksObtained: number
  totalMarks: number
  timeTaken: number
  startedAt: string | null
  submittedAt: string | null
  status: string
  set: {
    id: string
    title: string
    scheduledDate: string
    duration: number
    totalMarks: number
    totalQuestions: number
    package: {
      id: string
      title: string
      thumbnail: string | null
    }
  }
}

interface ResultsResponse {
  success: boolean
  data: {
    results: ExamResultItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

type SortOption = 'recent' | 'score' | 'date'

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${toBengaliNumerals(seconds)} সেকেন্ড`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60)
    return s > 0
      ? `${toBengaliNumerals(m)} মিনিট ${toBengaliNumerals(s)} সেকেন্ড`
      : `${toBengaliNumerals(m)} মিনিট`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${toBengaliNumerals(h)} ঘণ্টা ${toBengaliNumerals(rm)} মিনিট`
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return date.toLocaleDateString('bn-BD', options)
  } catch {
    return dateStr
  }
}

function getGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600' }
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-500' }
  if (percentage >= 70) return { grade: 'A-', color: 'text-teal-500' }
  if (percentage >= 60) return { grade: 'B', color: 'text-cyan-500' }
  if (percentage >= 50) return { grade: 'C', color: 'text-amber-500' }
  if (percentage >= 40) return { grade: 'D', color: 'text-orange-500' }
  return { grade: 'F', color: 'text-destructive' }
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function ResultCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-12 w-16 rounded-lg" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </CardContent>
    </Card>
  )
}

// ─── Result Card ─────────────────────────────────────────────────────────────

interface ResultCardProps {
  result: ExamResultItem
  onViewDetails: (result: ExamResultItem) => void
}

function ResultCard({ result, onViewDetails }: ResultCardProps) {
  const percentage =
    result.totalMarks > 0 ? (result.marksObtained / result.totalMarks) * 100 : 0
  const { grade, color: gradeColor } = getGrade(percentage)

  return (
    <motion.div variants={cardVariants}>
      <Card className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Score Circle */}
            <div className="shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/30"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${percentage}, 100`}
                    strokeLinecap="round"
                    className={cn(
                      percentage >= 70
                        ? 'text-emerald-500'
                        : percentage >= 40
                        ? 'text-amber-500'
                        : 'text-destructive'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-sm font-bold', gradeColor)}>{grade}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1">
                {result.set?.title || 'পরীক্ষা'}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {result.set?.package?.title || 'প্যাকেজ'}
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {result.submittedAt
                    ? formatDate(result.submittedAt)
                    : result.startedAt
                    ? formatDate(result.startedAt)
                    : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDuration(result.timeTaken)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="size-3" />
                  {result.totalCorrect}
                </span>
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="size-3" />
                  {result.totalWrong}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <MinusCircle className="size-3" />
                  {result.totalSkipped}
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-xs font-medium">
                  {Math.round(result.marksObtained)}/{Math.round(result.totalMarks)}
                </span>
              </div>

              {/* Action */}
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => onViewDetails(result)}
                >
                  <BookOpen className="size-3" />
                  বিস্তারিত
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Statistics Summary Card ─────────────────────────────────────────────────

interface StatsSummaryProps {
  totalExams: number
  avgScore: number
  highestScore: number
  totalCorrect: number
  totalWrong: number
  accuracyRate: number
}

function StatsSummaryCard({
  totalExams,
  avgScore,
  highestScore,
  totalCorrect,
  totalWrong,
  accuracyRate,
}: StatsSummaryProps) {
  const stats = [
    {
      label: 'মোট পরীক্ষা',
      value: toBengaliNumerals(totalExams),
      icon: Hash,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'গড় নম্বর',
      value: `${toBengaliNumerals(Math.round(avgScore))}%`,
      icon: BarChart3,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      borderColor: 'border-violet-200 dark:border-violet-800',
    },
    {
      label: 'সর্বোচ্চ নম্বর',
      value: `${toBengaliNumerals(Math.round(highestScore))}%`,
      icon: Award,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'মোট সঠিক',
      value: toBengaliNumerals(totalCorrect),
      icon: CheckCircle,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
      label: 'মোট ভুল',
      value: toBengaliNumerals(totalWrong),
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-200 dark:border-rose-800',
    },
    {
      label: 'সঠিকতার হার',
      value: `${toBengaliNumerals(Math.round(accuracyRate))}%`,
      icon: Target,
      color: accuracyRate >= 70 ? 'text-emerald-500' : accuracyRate >= 40 ? 'text-amber-500' : 'text-rose-500',
      bg: accuracyRate >= 70
        ? 'bg-emerald-50 dark:bg-emerald-950/40'
        : accuracyRate >= 40
        ? 'bg-amber-50 dark:bg-amber-950/40'
        : 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: accuracyRate >= 70
        ? 'border-emerald-200 dark:border-emerald-800'
        : accuracyRate >= 40
        ? 'border-amber-200 dark:border-amber-800'
        : 'border-rose-200 dark:border-rose-800',
    },
  ]

  return (
    <motion.div variants={cardVariants}>
      <Card className="border-border/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            সামগ্রিক পরিসংখ্যান
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'rounded-lg border p-2.5 sm:p-3 text-center transition-colors',
                  stat.bg,
                  stat.borderColor
                )}
              >
                <stat.icon className={cn('size-4 mx-auto mb-1', stat.color)} />
                <p className={cn('text-base sm:text-lg font-bold', stat.color)}>
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Performance Trend ───────────────────────────────────────────────────────

interface PerformanceTrendProps {
  results: ExamResultItem[]
}

function PerformanceTrend({ results }: PerformanceTrendProps) {
  // Take last 10 results, sorted by date ascending for the trend
  const trendData = useMemo(() => {
    const sorted = [...results]
      .sort((a, b) => {
        const dateA = a.submittedAt || a.startedAt || ''
        const dateB = b.submittedAt || b.startedAt || ''
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      })
      .slice(-10)

    return sorted.map((r) => ({
      id: r.id,
      title: r.set?.title || 'পরীক্ষা',
      percentage: r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0,
      date: r.submittedAt || r.startedAt || '',
    }))
  }, [results])

  if (trendData.length === 0) return null

  const maxPercentage = 100

  return (
    <motion.div variants={cardVariants}>
      <Card className="border-border/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-violet-500" />
            পারফরম্যান্স ট্রেন্ড
            <span className="text-xs text-muted-foreground font-normal">
              (সর্বশেষ {toBengaliNumerals(trendData.length)}টি পরীক্ষা)
            </span>
          </h3>

          {/* Bar Chart */}
          <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-40">
            {trendData.map((item, idx) => {
              const barHeight = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0
              const barColor =
                item.percentage >= 70
                  ? 'bg-emerald-500'
                  : item.percentage >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              const barColorHover =
                item.percentage >= 70
                  ? 'hover:bg-emerald-400'
                  : item.percentage >= 40
                  ? 'hover:bg-amber-400'
                  : 'hover:bg-rose-400'

              return (
                <div
                  key={item.id}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  {/* Percentage label */}
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity',
                      item.percentage >= 70
                        ? 'text-emerald-600'
                        : item.percentage >= 40
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    )}
                  >
                    {toBengaliNumerals(item.percentage)}%
                  </span>

                  {/* Bar */}
                  <div className="w-full relative" style={{ height: '100%' }}>
                    <div
                      className={cn(
                        'absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ease-out',
                        barColor,
                        barColorHover
                      )}
                      style={{
                        height: `${Math.max(barHeight, 4)}%`,
                        animationDelay: `${idx * 80}ms`,
                      }}
                    />
                  </div>

                  {/* Index label */}
                  <span className="text-[9px] text-muted-foreground mt-1">
                    {toBengaliNumerals(idx + 1)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">৭০%+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">৪০-৭০%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm bg-rose-500" />
              <span className="text-[10px] text-muted-foreground">&lt;৪০%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MCQExamHistoryPage() {
  const { navigate, goBack } = useRouterStore()
  const { isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()

  // State
  const [allResults, setAllResults] = useState<ExamResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filter & Sort
  const [filterPackageId, setFilterPackageId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ─── Fetch Results ──────────────────────────────────────────────────────

  const fetchResults = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('action', 'my-results')
      params.set('page', '1')
      params.set('limit', '999')

      const res = await fetch(`/api/mcq-exam-packages?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const json: ResultsResponse = await res.json()
      const fetchedResults = json.data?.results || []
      setAllResults(fetchedResults)
      if (json.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...json.data.pagination }))
      }
    } catch (err) {
      console.error('Failed to fetch results:', err)
      setAllResults([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchResults()
  }, [isAuthenticated])

  // ─── Computed Values ──────────────────────────────────────────────────

  // Extract unique packages for filter
  const packageOptions = useMemo(() => {
    const map = new Map<string, string>()
    allResults.forEach((r) => {
      if (r.set?.package?.id && r.set?.package?.title) {
        map.set(r.set.package.id, r.set.package.title)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [allResults])

  // Filtered & sorted results
  const filteredResults = useMemo(() => {
    let filtered = [...allResults]

    // Filter by package
    if (filterPackageId !== 'all') {
      filtered = filtered.filter((r) => r.set?.package?.id === filterPackageId)
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.submittedAt || a.startedAt || ''
          const dateB = b.submittedAt || b.startedAt || ''
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })
        break
      case 'score':
        filtered.sort((a, b) => {
          const pctA = a.totalMarks > 0 ? (a.marksObtained / a.totalMarks) * 100 : 0
          const pctB = b.totalMarks > 0 ? (b.marksObtained / b.totalMarks) * 100 : 0
          return pctB - pctA
        })
        break
      case 'date':
        filtered.sort((a, b) => {
          const dateA = a.submittedAt || a.startedAt || ''
          const dateB = b.submittedAt || b.startedAt || ''
          return new Date(dateA).getTime() - new Date(dateB).getTime()
        })
        break
    }

    return filtered
  }, [allResults, filterPackageId, sortBy])

  // Paginated results for display
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredResults.slice(start, start + itemsPerPage)
  }, [filteredResults, currentPage])

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)

  // Stats calculated from ALL results
  const stats = useMemo(() => {
    const totalExams = allResults.length
    if (totalExams === 0) {
      return {
        totalExams: 0,
        avgScore: 0,
        highestScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        accuracyRate: 0,
      }
    }

    let totalPercentage = 0
    let highestScore = 0
    let totalCorrect = 0
    let totalWrong = 0
    let totalAttempted = 0

    allResults.forEach((r) => {
      const pct = r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0
      totalPercentage += pct
      if (pct > highestScore) highestScore = pct
      totalCorrect += r.totalCorrect
      totalWrong += r.totalWrong
      totalAttempted += r.totalCorrect + r.totalWrong
    })

    const avgScore = totalPercentage / totalExams
    const accuracyRate = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0

    return {
      totalExams,
      avgScore,
      highestScore,
      totalCorrect,
      totalWrong,
      accuracyRate,
    }
  }, [allResults])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterPackageId, sortBy])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleViewDetails = (result: ExamResultItem) => {
    navigate('mcq-exam-package-detail', {
      packageId: result.set?.package?.id || '',
    })
  }

  // ─── Not Authenticated ──────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="size-6 text-emerald-500" />
              এক্সাম হিস্টোরি
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Card className="p-8 text-center max-w-md">
            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">লগইন করুন</p>
            <p className="text-sm text-muted-foreground mb-4">
              আপনার পরীক্ষার ইতিহাস দেখতে লগইন করুন
            </p>
            <Button onClick={() => navigate('login')}>লগইন করুন</Button>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="size-6 text-emerald-500" />
              এক্সাম হিস্টোরি
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              আপনার সকল পরীক্ষার ফলাফল
            </p>
          </div>
          {!loading && allResults.length > 0 && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <FileQuestion className="size-3" />
              {toBengaliNumerals(allResults.length)}টি পরীক্ষা
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {/* Stats skeleton */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-3 text-center">
                      <Skeleton className="size-4 rounded mx-auto mb-1" />
                      <Skeleton className="h-6 w-12 mx-auto mb-1" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Trend skeleton */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="flex items-end gap-2 h-32">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${30 + Math.random() * 70}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Result skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : allResults.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="কোনো পরীক্ষার ফলাফল নেই"
            description="আপনি এখনো কোনো MCQ এক্সাম প্যাকেজের পরীক্ষা দেননি। প্যাকেজ কিনে পরীক্ষায় অংশ নিন।"
            actionLabel="প্যাকেজ দেখুন"
            onAction={() => navigate('mcq-exam-package-list')}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* ── Statistics Summary ── */}
            <StatsSummaryCard
              totalExams={stats.totalExams}
              avgScore={stats.avgScore}
              highestScore={stats.highestScore}
              totalCorrect={stats.totalCorrect}
              totalWrong={stats.totalWrong}
              accuracyRate={stats.accuracyRate}
            />

            {/* ── Performance Trend ── */}
            <PerformanceTrend results={allResults} />

            {/* ── Filter & Sort Controls ── */}
            <motion.div variants={cardVariants}>
              <Card className="border-border/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Filter className="size-3.5" />
                      ফিল্টার
                    </div>

                    {/* Package filter */}
                    <Select
                      value={filterPackageId}
                      onValueChange={(val) => setFilterPackageId(val)}
                    >
                      <SelectTrigger size="sm" className="w-auto min-w-[140px] max-w-[200px] text-xs">
                        <SelectValue placeholder="সকল প্যাকেজ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সকল প্যাকেজ</SelectItem>
                        {packageOptions.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <span className="line-clamp-1">{pkg.title}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="h-6 hidden sm:block" />

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <ArrowUpDown className="size-3.5" />
                      সাজান
                    </div>

                    {/* Sort */}
                    <Select
                      value={sortBy}
                      onValueChange={(val) => setSortBy(val as SortOption)}
                    >
                      <SelectTrigger size="sm" className="w-auto min-w-[130px] text-xs">
                        <SelectValue placeholder="সাম্প্রতিক" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">সাম্প্রতিক</SelectItem>
                        <SelectItem value="score">নম্বর অনুযায়ী</SelectItem>
                        <SelectItem value="date">তারিখ অনুযায়ী</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Results count badge */}
                    {filterPackageId !== 'all' && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {toBengaliNumerals(filteredResults.length)}টি ফলাফল
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Results List ── */}
            {filteredResults.length === 0 ? (
              <motion.div variants={cardVariants}>
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center">
                    <Filter className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      এই ফিল্টারে কোনো ফলাফল নেই
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1"
                      onClick={() => setFilterPackageId('all')}
                    >
                      সকল ফলাফল দেখুন
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <AnimatePresence>
                {paginatedResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  আগের
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {toBengaliNumerals(currentPage)} / {toBengaliNumerals(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  পরের
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
