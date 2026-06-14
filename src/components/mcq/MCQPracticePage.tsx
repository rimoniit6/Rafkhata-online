'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileQuestion,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Play,
  Crown,
  BookOpen,
  GraduationCap,
  Search,
  Zap,
  Bookmark,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'
import { getMessages } from '@/lib/messages'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import BookmarkButton from '@/components/shared/BookmarkButton'

// ─── Types ──────────────────────────────────────────────────────

interface MCQListItem {
  id: string
  text: string
  questionImage?: string | null
  isPremium: boolean
  price: number
  classLevel: string
  subjectId: string
  chapterId: string
  chapterName: string
  difficulty: string
  board: string | null
  year: string | null
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

// ─── Animation variants ─────────────────────────────────────────

const pageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

// ─── Main Component ─────────────────────────────────────────────

export default function MCQPracticePage() {
  const { params, navigate, goBack } = useRouterStore()
  const { user } = useAuthStore()
  const metadata = useHierarchyMetadata()
  const msg = getMessages()

  // Route params
  const chapterId = params.chapterId || ''
  const subjectId = params.subjectId || ''
  const classSlug = params.classSlug || ''

  // Data states
  const [mcqList, setMcqList] = useState<MCQListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [apiCounts, setApiCounts] = useState<{ total: number; freeCount: number; premiumCount: number; boardCount: number; practiceCount: number }>({ total: 0, freeCount: 0, premiumCount: 0, boardCount: 0, practiceCount: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 20
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subjectName: string; className: string } | null>(null)
  const [subjectInfo, setSubjectInfo] = useState<{ name: string; className: string } | null>(null)

  // Purchase
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)
  const [bookmarkMap, setBookmarkMap] = useState<Record<string, boolean>>({})

  // Filter & expand state
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, { options: { key: string; text: string; image?: string | null }[]; correctAnswer: string; explanation: string; explanationImage?: string | null }>>({})

  // ─── Fetch MCQ list ────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Hierarchy-based query: chapterId > subjectId > classLevel
        // Never combine classLevel with subjectId/chapterId — classLevel values
        // in MCQ records may be inconsistent, causing wrong counts
        const queryParams = new URLSearchParams({ type: 'list', page: '1', limit: String(PAGE_SIZE) })
        if (chapterId) {
          queryParams.set('chapterId', chapterId)
        } else if (subjectId) {
          queryParams.set('subjectId', subjectId)
        } else if (classSlug) {
          queryParams.set('classLevel', classSlug)
        }

        const res = await fetch(`/api/mcq?${queryParams}`)
        if (res.ok) {
          const data = await res.json()
          setMcqList(data.data?.questions || [])
          setCurrentPage(1)
          setHasMore((data.pagination?.page || 1) < (data.pagination?.totalPages || 1))
          // Store API-returned counts for consistent display
          setApiCounts({
            total: data.data?.total || 0,
            freeCount: data.data?.freeCount || 0,
            premiumCount: data.data?.premiumCount || 0,
            boardCount: data.data?.boardCount || 0,
            practiceCount: data.data?.practiceCount || 0,
          })
        } else {
          setMcqList([])
          setApiCounts({ total: 0, freeCount: 0, premiumCount: 0, boardCount: 0, practiceCount: 0 })
          setHasMore(false)
        }

        // Fetch context info
        if (chapterId) {
          try {
            const chapterRes = await fetch(`/api/chapters/${chapterId}`)
            if (chapterRes.ok) {
              const chapterData = await chapterRes.json()
              setChapterInfo({
                name: chapterData.name || '',
                subjectName: chapterData.subjectName || '',
                className: chapterData.className || '',
              })
            }
          } catch { /* ignore */ }
        } else if (subjectId) {
          try {
            const subjectRes = await fetch(`/api/subjects/${subjectId}`)
            if (subjectRes.ok) {
              const subjectData = await subjectRes.json()
              setSubjectInfo({
                name: subjectData.name || '',
                className: subjectData.className || '',
              })
            }
          } catch { /* ignore */ }
        }
      } catch {
        setMcqList([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [chapterId, subjectId, classSlug])

  // ─── Batch check purchase status ───────────────────────────
  // Both non-logged-in and logged-in users use the same batch-check path
  // For non-logged-in users, the API returns purchased:false for all items

  useEffect(() => {
    if (mcqList.length === 0) return

    const premiumItems = mcqList.filter(q => q.isPremium)
    if (premiumItems.length === 0) return

    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(q => ({
              contentType: 'mcq',
              contentId: q.id,
            })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const item of items) {
            newMap[item.contentId] = {
              purchased: item.purchased || false,
              pendingPayment: item.pendingPayment || false,
            }
          }
          setPurchaseMap(newMap)
        }
      } catch {
        // Silently fail — premium items will show as locked
      }
    }
    checkPurchases()
  }, [mcqList])

  // ─── Batch check bookmark status ──────────────────────────

  useEffect(() => {
    if (!user?.id || mcqList.length === 0) return

    const checkBookmarks = async () => {
      try {
        const res = await fetch('/api/bookmarks/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: mcqList.map(q => ({
              contentId: q.id,
              contentType: 'mcq',
            })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const map: Record<string, boolean> = {}
          for (const item of (data.items || [])) {
            map[item.contentId] = item.isBookmarked
          }
          setBookmarkMap(map)
        }
      } catch {
        // Silently fail
      }
    }
    checkBookmarks()
  }, [mcqList, user?.id])

  // ─── Derived data ──────────────────────────────────────────

  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()

  const isQuestionLocked = useCallback((q: MCQListItem) => q.isPremium && !isPremiumUser && !purchaseMap[q.id]?.purchased, [isPremiumUser, purchaseMap])
  const isQuestionPending = useCallback((q: MCQListItem) => q.isPremium && purchaseMap[q.id]?.pendingPayment, [purchaseMap])

  const { freeMcqs, purchasedMcqs, lockedMcqs } = useMemo(() => {
    const free: MCQListItem[] = []
    const purchased: MCQListItem[] = []
    const locked: MCQListItem[] = []

    for (const q of mcqList) {
      if (!q.isPremium || isPremiumUser) {
        free.push(q)
      } else if (purchaseMap[q.id]?.purchased) {
        purchased.push(q)
      } else {
        locked.push(q)
      }
    }
    return { freeMcqs: free, purchasedMcqs: purchased, lockedMcqs: locked }
  }, [mcqList, isPremiumUser, purchaseMap])

  const accessibleMcqs = useMemo(() => [...freeMcqs, ...purchasedMcqs], [freeMcqs, purchasedMcqs])

  // ─── Page title ────────────────────────────────────────────

  const pageTitle = chapterId
    ? `${chapterInfo?.name || 'অধ্যায়'} - MCQ প্র্যাকটিস`
    : subjectId
    ? `${subjectInfo?.name || 'বিষয়'} - MCQ প্র্যাকটিস`
    : 'MCQ প্র্যাকটিস'

  const pageSubtitle = chapterId
    ? chapterInfo?.subjectName || ''
    : subjectId
    ? subjectInfo?.className || ''
    : ''

  // ─── Handlers ─────────────────────────────────────────────

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const queryParams = new URLSearchParams({ type: 'list', page: String(nextPage), limit: String(PAGE_SIZE) })
      if (chapterId) {
        queryParams.set('chapterId', chapterId)
      } else if (subjectId) {
        queryParams.set('subjectId', subjectId)
      } else if (classSlug) {
        queryParams.set('classLevel', classSlug)
      }

      const res = await fetch(`/api/mcq?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        setMcqList(prev => [...prev, ...(data.data?.questions || [])])
        setCurrentPage(nextPage)
        setHasMore(nextPage < (data.pagination?.totalPages || 1))
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setLoadingMore(false)
    }
  }

  const handleStartPractice = () => {
    if (chapterId) {
      navigate('mcq-exam', {
        chapterId,
        subjectId,
        classSlug,
      })
    } else if (subjectId) {
      navigate('mcq-exam', {
        subjectId,
        classSlug,
      })
    } else if (classSlug) {
      navigate('mcq-exam', {
        classSlug,
      })
    }
  }

  const handleMcqClick = async (q: MCQListItem) => {
    if (isQuestionLocked(q)) {
      handleLockedClick(q)
      return
    }
    if (expandedId === q.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(q.id)
    if (!expandedDetails[q.id]) {
      try {
        const res = await fetch(`/api/mcq/${q.id}`)
        if (res.ok) {
          const data = await res.json()
          const mcq = data.data || data
          setExpandedDetails(prev => ({
            ...prev,
            [q.id]: {
              options: mcq.options || [],
              correctAnswer: mcq.correctAnswer || '',
              explanation: mcq.explanation || '',
              explanationImage: mcq.explanationImage || null,
            }
          }))
        }
      } catch { /* ignore */ }
    }
  }

  const handleLockedClick = (q: MCQListItem) => {
    setPurchaseModalData({
      contentType: 'mcq',
      contentId: q.id,
      contentTitle: q.text.slice(0, 80) + (q.text.length > 80 ? '...' : ''),
      contentPrice: q.price,
      classLevel: q.classLevel,
    })
    setPurchaseModalOpen(true)
  }

  const handleBack = () => {
    goBack()
  }

  // ─── Helpers ──────────────────────────────────────────────

  const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }
  }

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'easy': return 'সহজ'
      case 'hard': return 'কঠিন'
      default: return 'মাঝারি'
    }
  }

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700" />
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (mcqList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <Search className="size-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{msg.noQuestionsFound}</p>
          <p className="text-sm text-muted-foreground mb-4">{msg.mcqComingSoon}</p>
          <Button variant="outline" onClick={handleBack}>ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileQuestion className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{pageTitle}</h1>
              {pageSubtitle && <p className="text-teal-100 text-sm mt-0.5">{pageSubtitle}</p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
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
                    {metadata.classLevelLabels[classSlug] || classSlug}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            {subjectId && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId, classSlug })}>
                    {chapterInfo?.subjectName || subjectInfo?.name || 'বিষয়'}
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
              <BreadcrumbPage>MCQ প্র্যাকটিস</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Stats Summary — uses API-returned counts for consistency */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 px-3 py-1 text-sm">
            <BookOpen className="size-3.5" />
            ফ্রি {toBengaliNum(apiCounts.freeCount)}টি
          </Badge>
          {purchasedMcqs.length > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 px-3 py-1 text-sm">
              <CheckCircle2 className="size-3.5" />
              কেনা {toBengaliNum(purchasedMcqs.length)}টি
            </Badge>
          )}
          {lockedMcqs.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 px-3 py-1 text-sm">
              <Lock className="size-3.5" />
              প্রিমিয়াম {toBengaliNum(lockedMcqs.length)}টি
            </Badge>
          )}
          {apiCounts.boardCount > 0 && (
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 gap-1 px-3 py-1 text-sm">
              <GraduationCap className="size-3.5" />
              বোর্ড {toBengaliNum(apiCounts.boardCount)}টি
            </Badge>
          )}
          {apiCounts.practiceCount > 0 && (
            <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 gap-1 px-3 py-1 text-sm">
              <FileQuestion className="size-3.5" />
              প্র্যাকটিস {toBengaliNum(apiCounts.practiceCount)}টি
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            মোট {toBengaliNum(apiCounts.total)}টি প্রশ্ন
          </span>
        </div>

        {/* Practice Button */}
        {accessibleMcqs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Zap className="size-7 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base">
                      {freeMcqs.length > 0 && purchasedMcqs.length > 0
                        ? `${toBengaliNum(freeMcqs.length)}টি ফ্রি + ${toBengaliNum(purchasedMcqs.length)}টি কেনা প্রশ্ন`
                        : purchasedMcqs.length > 0
                        ? `${toBengaliNum(purchasedMcqs.length)}টি কেনা প্রশ্ন`
                        : `${toBengaliNum(freeMcqs.length)}টি ফ্রি প্রশ্ন`
                      }
                    </h3>
                    <p className="text-teal-100 text-sm">প্র্যাকটিস শুরু করুন</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 gap-2"
                  onClick={handleStartPractice}
                >
                  <Play className="size-4" />
                  প্র্যাকটিস শুরু
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {/* ──── Filter Tabs ──── */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'free', 'premium'] as const).map(f => (
            <button
              key={f}
              onClick={() => setAccessFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                accessFilter === f
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f === 'all' ? 'সব' : f === 'free' ? 'ফ্রি' : 'প্রিমিয়াম'}
            </button>
          ))}
        </div>

        {/* ──── Free MCQs Section ──── */}
        {freeMcqs.length > 0 && (accessFilter === 'all' || accessFilter === 'free') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                ফ্রি প্রশ্ন ({toBengaliNum(freeMcqs.length)}টি)
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {freeMcqs.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                  >
                    <Card className={cn(
                      "group cursor-pointer hover:shadow-md transition-all relative overflow-hidden",
                      expandedId === q.id ? 'ring-2 ring-emerald-400 shadow-lg' : '',
                      q.board ? 'border-rose-200/50 dark:border-rose-800/50' : 'border-border/50'
                    )}
                      onClick={() => handleMcqClick(q)}
                    >
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", q.board ? 'bg-rose-500' : 'bg-green-500')} />
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        <BookmarkButton
                          contentId={q.id}
                          contentType="mcq"
                          contentTitle={q.text.slice(0, 80)}
                          size="sm"
                          variant="minimal"
                          className="text-muted-foreground hover:text-amber-600"
                          initialBookmarked={bookmarkMap[q.id]}
                          onToggle={(b) => setBookmarkMap(prev => ({ ...prev, [q.id]: b }))}
                        />
                        {q.board ? (
                          <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 text-xs gap-1">
                            <GraduationCap className="size-3" /> বোর্ড
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1">
                            <Play className="size-3" /> ফ্রি
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", q.board ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-green-50 dark:bg-green-950/30')}>
                            {q.board ? (
                              <GraduationCap className="size-5 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <FileQuestion className="size-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <RichContentRenderer content={q.text} className="font-medium text-sm leading-relaxed line-clamp-2 pr-16" />
                            {q.questionImage && (
                              <SafeImage src={q.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {q.board && q.year && (
                                <>
                                  <Badge className="bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 text-[10px] px-1.5 gap-0.5">
                                    {q.board} · {q.year}
                                  </Badge>
                                </>
                              )}
                              {q.chapterName && (
                                <>
                                  <BookOpen className="size-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{q.chapterName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Badge className={cn('text-[10px] px-1.5', getDifficultyColor(q.difficulty))}>
                                {getDifficultyLabel(q.difficulty)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      {expandedId === q.id && expandedDetails[q.id] && (
                        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {expandedDetails[q.id].options.map(opt => (
                              <div key={opt.key} className={cn(
                                'p-3 rounded-xl border-2 text-sm',
                                opt.key === expandedDetails[q.id].correctAnswer
                                  ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                                  : 'border-border/50 bg-card'
                              )}>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                                    opt.key === expandedDetails[q.id].correctAnswer
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-muted text-muted-foreground'
                                  )}>{opt.key}</span>
                                  <RichContentRenderer content={opt.text} className="text-sm" inline />
                                  {opt.image && (
                                    <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="max-w-full rounded-lg border max-h-16" />
                                  )}
                                  {opt.key === expandedDetails[q.id].correctAnswer && (
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {expandedDetails[q.id].explanation && (
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                ব্যাখ্যা: <RichContentRenderer content={expandedDetails[q.id].explanation} className="text-sm" inline />
                                {expandedDetails[q.id].explanationImage && (
                                  <SafeImage src={expandedDetails[q.id].explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ──── Purchased Premium MCQs Section ──── */}
        {purchasedMcqs.length > 0 && (accessFilter === 'all' || accessFilter === 'premium') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                কেনা প্রিমিয়াম প্রশ্ন ({toBengaliNum(purchasedMcqs.length)}টি)
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {purchasedMcqs.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                  >
                    <Card className={cn(
                      "group cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-emerald-200 dark:border-emerald-800",
                      expandedId === q.id ? 'ring-2 ring-emerald-400 shadow-lg' : ''
                    )}
                      onClick={() => handleMcqClick(q)}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        <BookmarkButton
                          contentId={q.id}
                          contentType="mcq"
                          contentTitle={q.text.slice(0, 80)}
                          size="sm"
                          variant="minimal"
                          className="text-muted-foreground hover:text-amber-600"
                          initialBookmarked={bookmarkMap[q.id]}
                          onToggle={(b) => setBookmarkMap(prev => ({ ...prev, [q.id]: b }))}
                        />
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1">
                          <CheckCircle2 className="size-3" /> কেনা
                        </Badge>
                      </div>
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg shrink-0 bg-emerald-50 dark:bg-emerald-950/30">
                            <FileQuestion className="size-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <RichContentRenderer content={q.text} className="font-medium text-sm leading-relaxed line-clamp-2 pr-16" />
                            {q.questionImage && (
                              <SafeImage src={q.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {q.chapterName && (
                                <>
                                  <BookOpen className="size-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{q.chapterName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Badge className={cn('text-[10px] px-1.5', getDifficultyColor(q.difficulty))}>
                                {getDifficultyLabel(q.difficulty)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      {expandedId === q.id && expandedDetails[q.id] && (
                        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                          <Separator />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {expandedDetails[q.id].options.map(opt => (
                              <div key={opt.key} className={cn(
                                'p-3 rounded-xl border-2 text-sm',
                                opt.key === expandedDetails[q.id].correctAnswer
                                  ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                                  : 'border-border/50 bg-card'
                              )}>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                                    opt.key === expandedDetails[q.id].correctAnswer
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-muted text-muted-foreground'
                                  )}>{opt.key}</span>
                                  <RichContentRenderer content={opt.text} className="text-sm" inline />
                                  {opt.image && (
                                    <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="max-w-full rounded-lg border max-h-16" />
                                  )}
                                  {opt.key === expandedDetails[q.id].correctAnswer && (
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {expandedDetails[q.id].explanation && (
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                ব্যাখ্যা: <RichContentRenderer content={expandedDetails[q.id].explanation} className="text-sm" inline />
                                {expandedDetails[q.id].explanationImage && (
                                  <SafeImage src={expandedDetails[q.id].explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ──── Locked Premium MCQs Section ──── */}
        {lockedMcqs.length > 0 && (accessFilter === 'all' || accessFilter === 'premium') && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-amber-500" />
              <Crown className="size-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                প্রিমিয়াম প্রশ্ন ({toBengaliNum(lockedMcqs.length)}টি)
              </span>
            </div>

            {/* Premium summary card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 shrink-0">
                      <Crown className="size-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                        {toBengaliNum(lockedMcqs.length)}টি প্রিমিয়াম প্রশ্ন আটকে আছে
                      </h3>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                        কিনলে প্র্যাকটিস ও এক্সাম উভয় মোডে পাবেন
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                      onClick={() => {
                        // Open purchase modal for the first locked MCQ
                        if (lockedMcqs.length > 0) {
                          handleLockedClick(lockedMcqs[0])
                        }
                      }}
                    >
                      <Lock className="size-3.5" />
                      কিনুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Locked MCQ list with preview */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {lockedMcqs.map((q, idx) => {
                  const pending = isQuestionPending(q)
                  return (
                    <motion.div
                      key={q.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                    >
                      <Card
                        className={cn(
                          'group cursor-pointer hover:shadow-md transition-all relative overflow-hidden',
                          'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',
                        )}
                        onClick={() => !pending && handleLockedClick(q)}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        {/* Badge */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                          <BookmarkButton
                            contentId={q.id}
                            contentType="mcq"
                            contentTitle={q.text.slice(0, 80)}
                            size="sm"
                            variant="minimal"
                            className="text-amber-400/60 hover:text-amber-600"
                            initialBookmarked={bookmarkMap[q.id]}
                            onToggle={(b) => setBookmarkMap(prev => ({ ...prev, [q.id]: b }))}
                          />
                          {pending ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1">
                              <AlertCircle className="size-3" /> অপেক্ষমাণ
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1">
                              <Lock className="size-3" /> প্রিমিয়াম
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 pl-5">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg shrink-0 bg-amber-50 dark:bg-amber-950/30">
                              <FileQuestion className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Preview text - blurred/truncated for locked content */}
                              <RichContentRenderer content={q.text.slice(0, 80) + (q.text.length > 80 ? '...' : '')} className="font-medium text-sm leading-relaxed line-clamp-2 pr-16 text-foreground/60" />
                              {q.questionImage && (
                                <SafeImage src={q.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40 opacity-60" />
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {q.chapterName && (
                                  <>
                                    <BookOpen className="size-3 text-muted-foreground/60" />
                                    <span className="text-xs text-muted-foreground/60">{q.chapterName}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge className={cn('text-[10px] px-1.5', getDifficultyColor(q.difficulty))}>
                                  {getDifficultyLabel(q.difficulty)}
                                </Badge>
                                {q.isPremium && q.price > 0 && !pending && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                                    ৳{q.price}
                                  </Badge>
                                )}
                              </div>
                              {/* Buy button */}
                              {!pending && (
                                <Button
                                  size="sm"
                                  className="mt-2 gap-1 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white"
                                  onClick={(e) => { e.stopPropagation(); handleLockedClick(q) }}
                                >
                                  <Lock className="size-3" /> ৳{q.price} - কিনুন
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 min-w-48"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  লোড হচ্ছে...
                </>
              ) : (
                <>
                  আরও দেখুন
                  <span className="text-xs text-muted-foreground">
                    ({mcqList.length}/{toBengaliNum(apiCounts.total)})
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Purchase Options Modal */}
      {purchaseModalData && (
        <PurchaseOptionsModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          contentType={purchaseModalData.contentType}
          contentId={purchaseModalData.contentId}
          contentTitle={purchaseModalData.contentTitle}
          contentPrice={purchaseModalData.contentPrice}
          classLevel={purchaseModalData.classLevel}
        />
      )}
    </div>
  )
}
