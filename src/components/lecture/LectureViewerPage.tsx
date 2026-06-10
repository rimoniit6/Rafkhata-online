'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Menu, Play, FileText, Download,
  BookOpen, FileQuestion, Clock, CheckCircle2, ArrowLeft, ArrowRight, X,
  Lock, Crown, Bookmark, StickyNote, Type,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import ContentBlockEditor, { deserializeBlocks, ContentBlock } from '@/components/ui/content-block-editor'
import PremiumLock from '@/components/shared/PremiumLock'
import BookmarkButton from '@/components/shared/BookmarkButton'
import NoteEditor from '@/components/shared/NoteEditor'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { downloadPdf, getFilenameFromUrl } from '@/lib/pdf-download'

interface LectureNavItem {
  id: string
  title: string
  number: number
  isCompleted: boolean
  isCurrent: boolean
}

interface LectureData {
  id: string
  title: string
  content: string
  videoUrl: string | null
  pdfUrl: string | null
  thumbnail: string | null
  chapterName: string
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
  chapterId: string
  isPremium: boolean
  price: number
  progress: number
  lectures: LectureNavItem[]
  currentIndex: number
  resources: { name: string; url: string; type: string }[]
}

export default function LectureViewerPage() {
  const { params, navigate, goBack } = useRouterStore()
  const { user } = useAuthStore()
  const [lectureData, setLectureData] = useState<LectureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<{
    purchased: boolean
    pendingPayment: boolean
    checked: boolean
  }>({ purchased: false, pendingPayment: false, checked: false })
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base')
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let lectureId = params.lectureId
        // If no lectureId provided, try to fetch the first lecture
        if (!lectureId) {
          try {
            // Try chapterId first, then subjectId as fallback
            const filterParam = params.chapterId
              ? `chapterId=${params.chapterId}`
              : params.subjectId
                ? `subjectId=${params.subjectId}`
                : ''
            if (filterParam) {
              const listRes = await fetch(`/api/lectures?${filterParam}&limit=1`)
              if (listRes.ok) {
                const listData = await listRes.json()
                const lectures = listData.lectures || []
                if (lectures.length > 0) {
                  lectureId = lectures[0].id
                }
              }
            }
          } catch {
            // Continue without lectureId
          }
        }
        if (!lectureId) {
          setLectureData(null)
          return
        }
        const res = await fetch(`/api/lectures/${lectureId}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setLectureData(data)

        // Record recently viewed & update progress
        if (user?.id && data?.id) {
          fetch('/api/recently-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: data.id,
              contentType: 'lecture',
              title: data.title,
            }),
          }).catch(() => {})

          // Auto-update progress to at least 5% when opening a lecture
          const currentProgress = data.progress || 0
          if (currentProgress < 5) {
            fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contentId: data.id,
                contentType: 'lecture',
                progress: 5,
              }),
            }).catch(() => {})
          }
        }
      } catch {
        setLectureData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.lectureId, params.chapterId, params.subjectId, params.classSlug])

  // Check payment status when lecture data is loaded and content is premium
  useEffect(() => {
    if (!lectureData?.isPremium || !lectureData?.id) return

    const checkPayment = async () => {
      try {
        const params = new URLSearchParams({
          contentType: 'lecture',
          contentId: lectureData.id,
        })
        if (user?.id) {
          params.set('userId', user.id)
        }
        const res = await fetch(`/api/payment/check?${params}`)
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          setPaymentStatus({
            purchased: data.purchased || false,
            pendingPayment: data.pendingPayment || false,
            checked: true,
          })
        } else {
          setPaymentStatus({ purchased: false, pendingPayment: false, checked: true })
        }
      } catch {
        setPaymentStatus({ purchased: false, pendingPayment: false, checked: true })
      }
    }

    checkPayment()
  }, [lectureData?.isPremium, lectureData?.id, user?.id])

  // Determine access: premium users always have access, or if content is not premium
  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()
  const isPremiumContent = lectureData?.isPremium ?? false
  const isLocked = isPremiumContent && !isPremiumUser && !paymentStatus.purchased
  const showContent = !isPremiumContent || isPremiumUser || paymentStatus.purchased

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-12 bg-muted" />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <Skeleton className="hidden lg:block w-64 h-96 rounded-xl" />
            <Skeleton className="flex-1 h-96 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!lectureData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-12 bg-muted" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">লেকচার পাওয়া যায়নি</h2>
            <p className="text-muted-foreground mb-4">এই অধ্যায়ের লেকচার শীঘ্রই যোগ করা হবে</p>
            <Button variant="outline" className="gap-2" onClick={goBack}>
              <ArrowLeft className="size-4" />
              ফিরে যান
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="space-y-1">
      <div className="px-3 py-2 mb-2">
        <h3 className="font-semibold text-sm">অধ্যায়: {lectureData.chapterName}</h3>
        <p className="text-xs text-muted-foreground mt-1">{lectureData.lectures.length}টি লেকচার</p>
      </div>
      <Separator className="mb-2" />
      {lectureData.lectures.map((lec) => (
        <button
          key={lec.id}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
            lec.isCurrent
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted'
          }`}
          onClick={() => {
            navigate('lecture-viewer', {
              lectureId: lec.id,
              chapterId: lectureData.chapterId,
              subjectId: lectureData.subjectId,
              classSlug: lectureData.classSlug,
            })
            setSidebarOpen(false)
          }}
        >
          <div className={`flex items-center justify-center size-6 rounded-full shrink-0 text-xs font-medium ${
            lec.isCompleted
              ? 'bg-emerald-500 text-white'
              : lec.isCurrent
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {lec.isCompleted ? <CheckCircle2 className="size-4" /> : lec.number}
          </div>
          <span className="truncate">{lec.title}</span>
        </button>
      ))}
    </div>
  )

  const hasPrev = lectureData.currentIndex > 0
  const hasNext = lectureData.currentIndex < lectureData.lectures.length - 1

  // Content rendering function
  const renderContent = () => (
    <>
      {/* Thumbnail Hero Banner */}
      {lectureData.thumbnail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-xl"
        >
          <div className="relative">
            <SafeImage
              src={lectureData.thumbnail}
              alt={lectureData.title}
              className="w-full max-h-80 object-cover rounded-xl"
            />
            {/* Gradient overlay at bottom for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent rounded-b-xl" />
          </div>
        </motion.div>
      )}
      {/* Video Embed */}
      {lectureData.videoUrl && showVideo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={lectureData.videoUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title="লেকচার ভিডিও"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 gap-1 text-muted-foreground"
            onClick={() => setShowVideo(false)}
          >
            <X className="size-4" />
            ভিডিও লুকান
          </Button>
        </motion.div>
      )}

      {!showVideo && lectureData.videoUrl && (
        <Button
          variant="outline"
          size="sm"
          className="mb-4 gap-2"
          onClick={() => setShowVideo(true)}
        >
          <Play className="size-4" />
          ভিডিও দেখুন
        </Button>
      )}

      {/* Article Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`max-w-none mb-8 ${
          fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'
        }`}
      >
        {(() => {
          try {
            const blocks = deserializeBlocks(lectureData.content)
            if (blocks.length > 0 && blocks[0].id) {
              return <ContentBlockEditor blocks={blocks} onChange={() => {}} previewMode />
            }
          } catch { /* not block content */ }
          // Fallback: render as HTML
          return <RichContentRenderer content={lectureData.content} />
        })()}
      </motion.div>

      {/* PDF Attachment */}
      {lectureData.pdfUrl && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="size-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">PDF নোটস</p>
              <p className="text-xs text-muted-foreground">ডাউনলোড করে অফলাইনে পড়ুন</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadPdf(lectureData.pdfUrl!, getFilenameFromUrl(lectureData.pdfUrl!))}>
              <Download className="size-4" />
              ডাউনলোড
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {lectureData.resources.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="size-5" />
            রিসোর্স
          </h3>
          <div className="space-y-2">
            {lectureData.resources.map((res, i) => (
              <Card key={i} className="hover:shadow-sm transition-shadow border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="size-5 text-primary shrink-0" />
                  <span className="flex-1 text-sm truncate">{res.name}</span>
                  <Badge variant="secondary" className="text-xs uppercase">{res.type}</Badge>
                  <Button size="sm" variant="ghost" className="gap-1" asChild>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted">
        <motion.div
          className="h-full bg-edu-primary"
          style={{ scaleX: scrollProgress, transformOrigin: 'left' }}
        />
      </div>

      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle>{lectureData.subjectName}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <div className="p-2">
                  <SidebarContent />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{lectureData.title}</p>
              {isPremiumContent && paymentStatus.purchased && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1 text-[10px] px-1.5 py-0 shrink-0">
                  <CheckCircle2 className="size-3" />
                  কেনা
                </Badge>
              )}
              {isPremiumContent && !paymentStatus.purchased && !isPremiumUser && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1 text-[10px] px-1.5 py-0 shrink-0">
                  <Lock className="size-3" />
                  প্রিমিয়াম
                </Badge>
              )}
              {isPremiumContent && isPremiumUser && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1 text-[10px] px-1.5 py-0 shrink-0">
                  <Crown className="size-3" />
                  প্রিমিয়াম
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{lectureData.subjectName}</span>
              <span>•</span>
              <span>{lectureData.className}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Font size controls */}
            <div className="hidden sm:flex items-center gap-0.5 border border-border/50 rounded-lg p-0.5">
              {(['sm', 'base', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    fontSize === size
                      ? 'bg-edu-primary/10 text-edu-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {size === 'sm' ? 'অ' : size === 'base' ? 'অ' : 'অ'}
                </button>
              ))}
            </div>
            <BookmarkButton
              contentId={lectureData.id}
              contentType="lecture"
              contentTitle={lectureData.title}
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-amber-600"
              onToggle={(b) => setIsBookmarked(b)}
            />
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>{lectureData.progress}% সম্পন্ন</span>
            </div>
          </div>
        </div>
        <Progress value={lectureData.progress} className="h-1 rounded-none" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 border-r min-h-[calc(100vh-5rem)] p-2 sticky top-[5rem] self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin">
            <SidebarContent />
          </aside>

          {/* Center Content */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug: lectureData.classSlug })}>
                    {lectureData.className}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId: lectureData.subjectId, classSlug: lectureData.classSlug })}>
                    {lectureData.subjectName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{lectureData.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Premium Content Check */}
            {isLocked ? (
              <PremiumLock
                purchased={paymentStatus.purchased}
                pendingPayment={paymentStatus.pendingPayment}
                price={lectureData.price}
                contentType="lecture"
                contentId={lectureData.id}
                contentTitle={lectureData.title}
                classLevel={lectureData.classSlug}
                title="প্রিমিয়াম লেকচার"
                description={lectureData.price > 0 
                  ? `এই লেকচারটি দেখতে ৳${lectureData.price} পেমেন্ট করুন`
                  : 'এই লেকচারটি দেখতে পেমেন্ট করুন'
                }
                onUpgrade={() => navigate('payment', {
                  contentType: 'lecture',
                  contentId: lectureData.id,
                  contentTitle: lectureData.title,
                  contentPrice: String(lectureData.price),
                })}
              >
                {/* Blurred preview content when locked */}
                <div className="blur-md pointer-events-none select-none opacity-50">
                  {renderContent()}
                </div>
              </PremiumLock>
            ) : (
              <>
                {/* কেনা Badge wrapper for purchased premium content */}
                {isPremiumContent && paymentStatus.purchased && (
                  <PremiumLock
                    purchased={true}
                    onUpgrade={() => {}}
                  >
                    {renderContent()}
                  </PremiumLock>
                )}
                {/* Normal content - either free or premium user (but not already purchased) */}
                {(!isPremiumContent || (isPremiumUser && !paymentStatus.purchased)) && renderContent()}
              </>
            )}

            {/* Next/Previous Navigation */}
            <Separator className="my-6" />
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                className="gap-2"
                disabled={!hasPrev}
                onClick={() => {
                  if (hasPrev) {
                    const prev = lectureData.lectures[lectureData.currentIndex - 1]
                    navigate('lecture-viewer', {
                      lectureId: prev.id,
                      chapterId: lectureData.chapterId,
                      subjectId: lectureData.subjectId,
                      classSlug: lectureData.classSlug,
                    })
                  }
                }}
              >
                <ArrowLeft className="size-4" />
                আগের লেকচার
              </Button>
              <span className="text-sm text-muted-foreground">
                {lectureData.currentIndex + 1} / {lectureData.lectures.length}
              </span>
              <Button
                className="gap-2"
                disabled={!hasNext}
                onClick={() => {
                  if (hasNext) {
                    const next = lectureData.lectures[lectureData.currentIndex + 1]
                    navigate('lecture-viewer', {
                      lectureId: next.id,
                      chapterId: lectureData.chapterId,
                      subjectId: lectureData.subjectId,
                      classSlug: lectureData.classSlug,
                    })
                  }
                }}
              >
                পরের লেকচার
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </main>

          {/* Right Panel - Desktop */}
          <aside className="hidden xl:block w-72 border-l p-4 sticky top-[5rem] self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin">
            {/* Quick MCQ */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <FileQuestion className="size-4 text-primary" />
                  দ্রুত MCQ প্র্যাকটিস
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  এই লেকচারের MCQ প্রশ্ন দিয়ে নিজেকে যাচাই করুন
                </p>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate('mcq-practice', {
                    chapterId: lectureData.chapterId,
                    subjectId: lectureData.subjectId,
                    classSlug: lectureData.classSlug,
                  })}
                >
                  <Play className="size-4" />
                  শুরু করুন
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <StickyNote className="size-4 text-primary" />
                  নোটস
                </h4>
                {lectureData?.id && (
                  <NoteEditor contentId={lectureData.id} contentType="lecture" />
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
