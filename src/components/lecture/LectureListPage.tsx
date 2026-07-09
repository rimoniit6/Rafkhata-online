'use client'

import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,BreadcrumbPage,BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMessages } from '@/lib/messages'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertCircle,
ArrowLeft,
BookOpen,
CheckCircle2,
Clock,
Crown,
Download,
Eye,
FileText,
Lock,
Play,
PlayCircle,
Video,
} from 'lucide-react'
import { useCallback,useEffect,useMemo,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

interface LectureListItem {
  id: string
  title: string
  content: string
  videoUrl: string | null
  pdfUrl: string | null
  chapterName: string
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
  chapterId: string
  isPremium: boolean
  price: number
  order: number
  duration: number
  progress: number
  resources: { name: string; url: string; type: string }[]
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

// ─── Main Component ─────────────────────────────────────────────

export default function LectureListPage() {
  const { params, navigate, goBack } = useRouterStore()
  const { user } = useAuthStore()
  const msg = getMessages()

  // Route params
  const chapterId = params.chapterId || ''
  const subjectId = params.subjectId || ''
  const classSlug = params.classSlug || ''

  // Data states
  const [lectureList, setLectureList] = useState<LectureListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subjectName: string; className: string } | null>(null)

  // Purchase
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  // ─── Fetch Lecture list ────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // When chapterId is provided, don't also send classLevel — chapterId
        // already uniquely identifies the lectures; classLevel can cause mismatches
        const queryParams = new URLSearchParams({ limit: '500' })
        if (chapterId) {
          queryParams.set('chapterId', chapterId)
        } else {
          if (subjectId) queryParams.set('subjectId', subjectId)
          if (classSlug) queryParams.set('classLevel', classSlug)
        }

        const res = await fetch(`/api/lectures?${queryParams}`)
        if (res.ok) {
          const data = await res.json()
          setLectureList(data.data?.lectures || [])
        } else {
          setLectureList([])
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
        }
      } catch {
        setLectureList([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [chapterId, subjectId, classSlug])

  // ─── Batch check purchase status ───────────────────────────
  // Both non-logged-in and logged-in users use the same batch-check path

  useEffect(() => {
    if (lectureList.length === 0) return

    const premiumItems = lectureList.filter(l => l.isPremium)
    if (premiumItems.length === 0) return

    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(l => ({
              contentType: 'lecture',
              contentId: l.id,
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
  }, [lectureList])

  // ─── Derived data ──────────────────────────────────────────

  const _isLocked = useCallback((l: LectureListItem) => l.isPremium && !purchaseMap[l.id]?.purchased, [purchaseMap])
  const isPending = useCallback((l: LectureListItem) => l.isPremium && purchaseMap[l.id]?.pendingPayment, [purchaseMap])

  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()

  const { freeLectures, purchasedLectures, lockedLectures } = useMemo(() => {
    const free: LectureListItem[] = []
    const purchased: LectureListItem[] = []
    const locked: LectureListItem[] = []

    for (const l of lectureList) {
      if (!l.isPremium || isPremiumUser) {
        free.push(l)
      } else if (purchaseMap[l.id]?.purchased) {
        purchased.push(l)
      } else {
        locked.push(l)
      }
    }
    return { freeLectures: free, purchasedLectures: purchased, lockedLectures: locked }
  }, [lectureList, purchaseMap, isPremiumUser])

  // ─── Page title ────────────────────────────────────────────

  const pageTitle = chapterInfo
    ? `${chapterInfo.name} - লেকচার সমূহ`
    : 'লেকচার সমূহ'

  const pageSubtitle = chapterInfo?.subjectName || ''

  // ─── Handlers ─────────────────────────────────────────────

  const handleViewLecture = (lecture: LectureListItem) => {
    navigate('lecture-viewer', {
      lectureId: lecture.id,
      chapterId: lecture.chapterId || chapterId,
      subjectId: lecture.subjectId || subjectId,
      classSlug: lecture.classSlug || classSlug,
    })
  }

  const handleLockedClick = (l: LectureListItem) => {
    setPurchaseModalData({
      contentType: 'lecture',
      contentId: l.id,
      contentTitle: l.title,
      contentPrice: l.price,
      classLevel: l.classSlug,
    })
    setPurchaseModalOpen(true)
  }

  const handleBack = () => {
    goBack()
  }

  // ─── Helpers ──────────────────────────────────────────────

  const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

  const formatDuration = (minutes: number) => {
    if (minutes <= 0) return ''
    if (minutes < 60) return `${toBengaliNum(minutes)} মিনিট`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${toBengaliNum(hrs)} ঘণ্টা ${toBengaliNum(mins)} মিনিট` : `${toBengaliNum(hrs)} ঘণ্টা`
  }

  // ─── Lecture Card renderer ──────────────────────────────────

  const renderLectureCard = (lecture: LectureListItem, idx: number, variant: 'free' | 'purchased' | 'locked') => {
    const pending = isPending(lecture)
    const locked = variant === 'locked'
    const hasVideo = !!lecture.videoUrl
    const hasPdf = !!lecture.pdfUrl
    const hasResources = lecture.resources && lecture.resources.length > 0

    const variantStyles = {
      free: {
        accent: 'bg-green-500',
        badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
        badgeIcon: <Eye className="size-3" />,
        badgeText: 'ফ্রি',
        iconBg: 'bg-green-50 dark:bg-green-950/30',
        iconColor: 'text-green-600 dark:text-green-400',
      },
      purchased: {
        accent: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
        badgeIcon: <CheckCircle2 className="size-3" />,
        badgeText: 'কেনা',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
      locked: {
        accent: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
        badgeIcon: pending ? <AlertCircle className="size-3" /> : <Lock className="size-3" />,
        badgeText: pending ? 'অপেক্ষমাণ' : 'প্রিমিয়াম',
        iconBg: 'bg-amber-50 dark:bg-amber-950/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
    }

    const style = variantStyles[variant]

    return (
      <motion.div
        key={lecture.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: idx * 0.03, duration: 0.2 }}
      >
        <Card
          className={cn(
            'group cursor-pointer hover:shadow-md transition-all relative overflow-hidden',
            locked && 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',
            variant === 'purchased' && 'border-emerald-200 dark:border-emerald-800',
          )}
          onClick={() => locked && !pending ? handleLockedClick(lecture) : handleViewLecture(lecture)}
        >
          <div className={cn('absolute left-0 top-0 bottom-0 w-1', style.accent)} />
          {/* Badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge className={cn('text-xs gap-1', style.badge)}>
              {style.badgeIcon} {style.badgeText}
            </Badge>
          </div>
          <CardContent className="p-4 pl-5">
            <div className="flex items-start gap-3">
              {/* Order number */}
              <div className={cn(
                'flex items-center justify-center size-10 rounded-xl shrink-0 font-bold text-lg',
                style.iconBg, style.iconColor
              )}>
                {toBengaliNum(lecture.order)}
              </div>
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className={cn(
                  'font-semibold text-sm leading-relaxed line-clamp-2 pr-16',
                  locked ? 'text-foreground/60' : 'text-foreground'
                )}>
                  {lecture.title}
                </h3>
                {/* Content type indicators */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {hasVideo && (
                    <Badge variant="outline" className="text-[10px] px-1.5 gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                      <Video className="size-3" /> ভিডিও
                    </Badge>
                  )}
                  {hasPdf && (
                    <Badge variant="outline" className="text-[10px] px-1.5 gap-1 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800">
                      <FileText className="size-3" /> PDF
                    </Badge>
                  )}
                  {hasResources && (
                    <Badge variant="outline" className="text-[10px] px-1.5 gap-1">
                      <Download className="size-3" /> {toBengaliNum(lecture.resources.length)}টি রিসোর্স
                    </Badge>
                  )}
                  {lecture.duration > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 gap-1">
                      <Clock className="size-3" /> {formatDuration(lecture.duration)}
                    </Badge>
                  )}
                </div>
                {/* Chapter name (when viewing multiple chapters) */}
                {lecture.chapterName && !chapterId && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <BookOpen className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{lecture.chapterName}</span>
                  </div>
                )}
                {/* Price & buy for locked */}
                {locked && lecture.price > 0 && !pending && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                      ৳{lecture.price}
                    </Badge>
                  </div>
                )}
                {/* Action button */}
                {locked && !pending ? (
                  <Button
                    size="sm"
                    className="mt-2 gap-1 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={(e) => { e.stopPropagation(); handleLockedClick(lecture) }}
                  >
                    <Lock className="size-3" /> ৳{lecture.price} - কিনুন
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 gap-1 text-xs h-7"
                    onClick={(e) => { e.stopPropagation(); handleViewLecture(lecture) }}
                  >
                    <Play className="size-3" /> দেখুন
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600" />
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (lectureList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <PlayCircle className="size-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">কোনো লেকচার পাওয়া যায়নি</p>
          <p className="text-sm text-muted-foreground mb-4">{msg.lectureComingSoon}</p>
          <Button variant="outline" onClick={handleBack}>ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{pageTitle}</h1>
              {pageSubtitle && <p className="text-emerald-100 text-sm mt-0.5">{pageSubtitle}</p>}
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
                    {chapterInfo?.className || classSlug}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            {(subjectId || chapterInfo?.subjectName) && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate('subject-detail', { subjectId: subjectId || '', classSlug })}
                  >
                    {chapterInfo?.subjectName || 'বিষয়'}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            {chapterId && chapterInfo?.name && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate('chapter-detail', { chapterId, subjectId, classSlug })}
                  >
                    {chapterInfo.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>লেকচার সমূহ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Stats Summary */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {freeLectures.length > 0 && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 px-3 py-1 text-sm">
              <BookOpen className="size-3.5" />
              ফ্রি {toBengaliNum(freeLectures.length)}টি
            </Badge>
          )}
          {purchasedLectures.length > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 px-3 py-1 text-sm">
              <CheckCircle2 className="size-3.5" />
              কেনা {toBengaliNum(purchasedLectures.length)}টি
            </Badge>
          )}
          {lockedLectures.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 px-3 py-1 text-sm">
              <Lock className="size-3.5" />
              প্রিমিয়াম {toBengaliNum(lockedLectures.length)}টি
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            মোট {toBengaliNum(lectureList.length)}টি লেকচার
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {/* ──── Free/Premium-accessible Lectures Section ──── */}
        {freeLectures.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                লেকচার ({toBengaliNum(freeLectures.length)}টি)
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {freeLectures.map((lecture, idx) => renderLectureCard(lecture, idx, 'free'))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ──── Purchased Premium Lectures Section ──── */}
        {purchasedLectures.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                কেনা প্রিমিয়াম লেকচার ({toBengaliNum(purchasedLectures.length)}টি)
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {purchasedLectures.map((lecture, idx) => renderLectureCard(lecture, idx, 'purchased'))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ──── Locked Premium Lectures Section ──── */}
        {lockedLectures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-amber-500" />
              <Crown className="size-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                প্রিমিয়াম লেকচার ({toBengaliNum(lockedLectures.length)}টি)
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
                        {toBengaliNum(lockedLectures.length)}টি প্রিমিয়াম লেকচার আটকে আছে
                      </h3>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                        কিনলে সম্পূর্ণ লেকচার দেখতে পাবেন
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Locked lecture list with preview */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {lockedLectures.map((lecture, idx) => renderLectureCard(lecture, idx, 'locked'))}
              </AnimatePresence>
            </div>
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
