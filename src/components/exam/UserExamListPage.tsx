'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  FileQuestion,
  AlignLeft,
  Crown,
  Search,
  ArrowLeft,
  Play,
  BookOpen,
  Target,
  Award,
  Filter,
  ClipboardCheck,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/shared/EmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PublicExam {
  id: string
  title: string
  description: string | null
  classLevel: string
  type: string // mcq, cq, mixed
  duration: number // minutes
  totalMarks: number
  marksPerMcq: number
  negativeMarks: number
  isPremium: boolean
  price: number
  instructions: string | null
  totalQuestions: number
}

interface ExamListResponse {
  data: PublicExam[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  cq: 'সৃজনশীল প্রশ্ন',
  mixed: 'মিশ্র',
}

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  mixed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
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
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function ExamCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        {/* Top accent bar */}
        <Skeleton className="h-1.5 w-full" />
        <div className="p-5 space-y-4">
          {/* Title + Badge row */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          {/* Stats */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          {/* Button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Exam Card ───────────────────────────────────────────────────────────────

function ExamCard({
  exam,
  onStart,
  onPremiumClick,
  classLevelLabels,
  classLevelColors,
}: {
  exam: PublicExam
  onStart: (exam: PublicExam) => void
  onPremiumClick: (exam: PublicExam) => void
  classLevelLabels: Record<string, string>
  classLevelColors: Record<string, string>
}) {
  const classLabel = classLevelLabels[exam.classLevel] || exam.classLevel
  const typeLabel = TYPE_LABELS[exam.type] || exam.type
  const typeColor = TYPE_COLORS[exam.type] || TYPE_COLORS.mixed
  const classColor = classLevelColors[exam.classLevel] || classLevelColors['class-6']

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -2 }} className="h-full">
      <Card className="overflow-hidden border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1">
          {/* Top accent bar */}
          <div
            className={cn(
              'h-1.5 w-full',
              exam.isPremium
                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500'
            )}
          />

          <div className="p-5 flex flex-col flex-1">
            {/* Title + Premium badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-2 flex-1">
                {exam.title}
              </h3>
              {exam.isPremium && (
                <Badge
                  className={cn(
                    'shrink-0 gap-1 bg-amber-100 text-amber-700 border-amber-200',
                    'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                  )}
                >
                  <Crown className="size-3 fill-amber-500/30" />
                  প্রিমিয়াম
                </Badge>
              )}
            </div>

            {/* Class + Type badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className={cn('text-xs font-medium', classColor)}>
                {classLabel}
              </Badge>
              <Badge variant="outline" className={cn('text-xs font-medium', typeColor)}>
                {typeLabel}
              </Badge>
              {exam.negativeMarks > 0 && (
                <Badge variant="outline" className="text-xs font-medium text-destructive border-destructive/30">
                  -{exam.negativeMarks} নেগেটিভ
                </Badge>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-500" />
                {exam.duration} মিনিট
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="size-3.5 text-teal-500" />
                {exam.totalMarks} নম্বর
              </span>
              <span className="flex items-center gap-1.5">
                <FileQuestion className="size-3.5 text-cyan-500" />
                {exam.totalQuestions} প্রশ্ন
              </span>
            </div>

            {/* Description */}
            {exam.description && (
              <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                <RichContentRenderer content={exam.description} />
              </div>
            )}

            {/* Spacer pushes button to bottom */}
            <div className="mt-auto" />

            {/* Action button */}
            {exam.isPremium ? (
              <Button
                className={cn(
                  'w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600',
                  'hover:from-amber-600 hover:to-amber-700 text-white border-0'
                )}
                onClick={() => onPremiumClick(exam)}
              >
                <Crown className="size-4" />
                প্রিমিয়াম — ৳{exam.price}
              </Button>
            ) : (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                onClick={() => onStart(exam)}
              >
                <Play className="size-4" />
                পরীক্ষা শুরু করুন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserExamListPage() {
  const { navigate, goBack, params: routeParams } = useRouterStore()
  const { classLevelLabels: CLASS_LEVEL_LABELS, classLevelColors: CLASS_COLORS, classOptions } = useHierarchyMetadata()

  // Chapter-level context from route params (when navigating from chapter detail)
  const chapterId = routeParams.chapterId || ''
  const subjectId = routeParams.subjectId || ''
  const classSlug = routeParams.classSlug || ''

  // Is this page accessed from a chapter context?
  const isChapterContext = !!chapterId

  // Chapter info for breadcrumb (fetched when navigating from chapter)
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subjectName: string; className: string } | null>(null)

  // State
  const [exams, setExams] = useState<PublicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [classLevel, setClassLevel] = useState<string>('all')
  const [examType, setExamType] = useState<string>('mcq')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  // Instructions dialog
  const [instructionsExam, setInstructionsExam] = useState<PublicExam | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Premium dialog
  const [premiumExam, setPremiumExam] = useState<PublicExam | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch chapter info for breadcrumb
  useEffect(() => {
    if (!chapterId) return
    const fetchChapterInfo = async () => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`)
        if (res.ok) {
          const data = await res.json()
          setChapterInfo({
            name: data.name || '',
            subjectName: data.subjectName || '',
            className: data.className || '',
          })
        }
      } catch { /* ignore */ }
    }
    fetchChapterInfo()
  }, [chapterId])

  // ─── Fetch Exams ─────────────────────────────────────────────────────────

  const fetchExams = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(pagination.limit))
        params.set('isActive', 'true')
        params.set('status', 'published')

        if (chapterId) {
          params.set('chapterId', chapterId)
        } else if (classLevel && classLevel !== 'all') {
          params.set('classLevel', classLevel)
        }
        if (examType && examType !== 'all') {
          params.set('type', examType)
        }
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }

        const res = await fetch(`/api/exams?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch exams')

        const json: ExamListResponse = await res.json()
        setExams(Array.isArray(json.data) ? json.data : [])
        if (json.pagination) {
          setPagination((prev) => ({ ...prev, ...json.pagination }))
        }
      } catch (err) {
        console.error('Failed to fetch exams:', err)
        setExams([])
      } finally {
        setLoading(false)
      }
    },
    [chapterId, classLevel, examType, searchQuery, pagination.limit]
  )

  // Fetch on filter change or chapter context change
  useEffect(() => {
    fetchExams(1)
  }, [classLevel, examType, chapterId])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExams(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Initial fetch
  useEffect(() => {
    fetchExams(1)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleStartExam = (exam: PublicExam) => {
    if (exam.type === 'mcq' || exam.type === 'mixed') {
      // Show instructions dialog first
      setInstructionsExam(exam)
      setInstructionsOpen(true)
    } else {
      // CQ exams — navigate to CQ viewer or exam page
      navigate('mcq-exam', { examId: exam.id })
    }
  }

  const handleConfirmStart = () => {
    if (instructionsExam) {
      navigate('mcq-exam', { examId: instructionsExam.id })
    }
    setInstructionsOpen(false)
    setInstructionsExam(null)
  }

  const handlePremiumClick = (exam: PublicExam) => {
    setPremiumExam(exam)
    setPremiumOpen(true)
  }

  const handlePremiumProceed = () => {
    // This is now handled by PurchaseOptionsModal
    setPremiumOpen(false)
    setPremiumExam(null)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // Page title
  const pageTitle = isChapterContext
    ? `${chapterInfo?.name || 'অধ্যায়'} - পরীক্ষা`
    : 'এক্সাম সেন্টার'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - only show when in chapter context */}
      {isChapterContext && (
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent)]" />
          <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2" onClick={goBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{pageTitle}</h1>
                {chapterInfo?.subjectName && <p className="text-sky-100 text-sm mt-0.5">{chapterInfo.subjectName}</p>}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Breadcrumb - only when in chapter context */}
      {isChapterContext && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {classSlug && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug })}>
                      {chapterInfo?.className || classSlug}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {subjectId && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId, classSlug })}>
                      {chapterInfo?.subjectName || 'বিষয়'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {chapterId && chapterInfo?.name && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('chapter-detail', { chapterId, subjectId, classSlug })}>
                      {chapterInfo.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>পরীক্ষা</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Header Section - standalone mode (not from chapter) */}
      {!isChapterContext && (
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-4">
              <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
                <ArrowLeft className="size-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="size-6 text-emerald-500" />
                  এক্সাম সেন্টার
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Award className="size-3" />
                  {pagination.total}টি পরীক্ষা
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("px-4 sm:px-6 lg:px-8 py-6", isChapterContext ? "max-w-5xl mx-auto" : "max-w-7xl mx-auto")}>
        {/* Exam Package Promo Banners - only in standalone mode */}
        {!isChapterContext && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <Card 
            className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 cursor-pointer hover:shadow-md transition-all overflow-hidden"
            onClick={() => navigate('mcq-exam-package-list')}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">MCQ এক্সাম প্যাকেজ</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">তারিখ অনুযায়ী নির্ধারিত এক্সাম প্যাকেজ — কিনুন, এক্সাম দিন, ফলাফল দেখুন</p>
                </div>
                <div className="shrink-0">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                    নতুন
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <Card 
            className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 cursor-pointer hover:shadow-md transition-all overflow-hidden"
            onClick={() => navigate('cq-exam-package-list')}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <AlignLeft className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">CQ এক্সাম প্যাকেজ</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">সৃজনশীল প্রশ্নের প্যাকেজ — কিনুন, উত্তর লিখুন, ফলাফল দেখুন</p>
                </div>
                <div className="shrink-0">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">
                    নতুন
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </>
        )}

        {/* Filter Bar - only in standalone mode */}
        {!isChapterContext && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Class Level Filter */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Filter className="size-4 text-muted-foreground shrink-0" />
                  <Select value={classLevel} onValueChange={setClassLevel}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="শ্রেণি" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সকল শ্রেণি</SelectItem>
                      {classOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type Filter */}
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="ধরন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল ধরন</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="পরীক্ষা খুঁজুন..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Content Area */}
        {loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        ) : exams.length === 0 ? (
          // Empty State
          <EmptyState
            icon={FileQuestion}
            title="কোনো পরীক্ষা পাওয়া যায়নি"
            description="আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আসুন। নতুন পরীক্ষা যুক্ত হলে এখানে দেখা যাবে।"
            actionLabel="ফিল্টার রিসেট করুন"
            onAction={() => {
              setClassLevel('all')
              setExamType('mcq')
              setSearchQuery('')
            }}
          />
        ) : (
          // Exam Cards Grid
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence>
              {exams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onStart={handleStartExam}
                  onPremiumClick={handlePremiumClick}
                  classLevelLabels={CLASS_LEVEL_LABELS}
                  classLevelColors={CLASS_COLORS}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchExams(pagination.page - 1)}
            >
              আগের
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchExams(pagination.page + 1)}
            >
              পরের
            </Button>
          </div>
        )}
      </div>

      {/* ─── Instructions Dialog ──────────────────────────────────────────── */}
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="size-5 text-emerald-500" />
              পরীক্ষার নির্দেশনা
            </DialogTitle>
            <DialogDescription>
              পরীক্ষা শুরু করার আগে নিচের নির্দেশনাগুলো পড়ুন
            </DialogDescription>
          </DialogHeader>

          {instructionsExam && (
            <div className="space-y-4">
              {/* Exam Info */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="font-semibold text-foreground">
                  {instructionsExam.title}
                </h4>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {instructionsExam.duration} মিনিট
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" />
                    {instructionsExam.totalMarks} নম্বর
                  </span>
                  <span className="flex items-center gap-1">
                    <FileQuestion className="size-3.5" />
                    {instructionsExam.totalQuestions} প্রশ্ন
                  </span>
                </div>
              </div>

              {/* Default Instructions (always shown) */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">সাধারণ নিয়মাবলী:</h5>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>পরীক্ষা শুরু হলে নির্দিষ্ট সময়ের মধ্যে উত্তর দিতে হবে</li>
                  <li>একবার পরীক্ষা শুরু করলে আর ফিরে যাওয়া যাবে না</li>
                  <li>প্রতিটি সঠিক উত্তরের জন্য {instructionsExam.marksPerMcq} নম্বর পাবেন</li>
                  {instructionsExam.negativeMarks > 0 && (
                    <li className="text-destructive font-medium">
                      প্রতিটি ভুল উত্তরের জন্য -{instructionsExam.negativeMarks} নম্বর কাটা যাবে
                    </li>
                  )}
                  <li>পরীক্ষা শেষে আপনার ফলাফল দেখা যাবে</li>
                </ul>
              </div>

              {/* Custom Instructions (if provided) */}
              {instructionsExam.instructions && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">বিশেষ নির্দেশনা:</h5>
                  <div className="text-sm text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                    {instructionsExam.instructions}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInstructionsOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
              onClick={handleConfirmStart}
            >
              <Play className="size-4" />
              পরীক্ষা শুরু করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Purchase Options Modal ───────────────────────────────────────────── */}
      {premiumExam && (
        <PurchaseOptionsModal
          open={premiumOpen}
          onOpenChange={(open) => {
            setPremiumOpen(open)
            if (!open) {
              setPremiumExam(null)
            }
          }}
          contentType="exam"
          contentId={premiumExam.id}
          contentTitle={premiumExam.title}
          contentPrice={premiumExam.price}
          classLevel={premiumExam.classLevel}
        />
      )}
    </div>
  )
}
