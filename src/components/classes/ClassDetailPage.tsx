'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronRight, ArrowLeft, PlayCircle, FileQuestion,
  ClipboardList, GraduationCap, Lightbulb, Award, Loader2,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getMessages } from '@/lib/messages'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

interface Subject {
  id: string
  name: string
  slug: string
  icon: string
  chapterCount: number
  color: string
  contentCounts: {
    lectures: number
    mcqs: number
    cqs: number
    boardQuestions: number
  }
}

interface ContentOverview {
  totalLectures: number
  totalMcqs: number
  totalCqs: number
  totalBoardQuestions: number
}

interface ClassData {
  id: string
  name: string
  slug: string
  description: string | null
  subjects: Subject[]
  contentOverview: ContentOverview
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function toBn(n: number): string {
  return n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])
}

// Content type action chips shown on each subject card
const CONTENT_CHIPS = [
  { key: 'lecture', label: 'লেকচার', icon: PlayCircle, tabKey: 'lecture', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { key: 'mcq', label: 'MCQ', icon: FileQuestion, tabKey: 'mcq', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  { key: 'cq', label: 'সৃজনশীল', icon: ClipboardList, tabKey: 'cq', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { key: 'board', label: 'বোর্ড', icon: GraduationCap, tabKey: 'board', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
]

// Class themes by slug
const CLASS_THEMES: Record<string, { gradient: string; accent: string }> = {
  'class-6': { gradient: 'from-emerald-600 via-emerald-500 to-teal-600', accent: 'text-emerald-600 dark:text-emerald-400' },
  'class-7': { gradient: 'from-teal-600 via-teal-500 to-cyan-600', accent: 'text-teal-600 dark:text-teal-400' },
  'class-8': { gradient: 'from-cyan-600 via-cyan-500 to-teal-600', accent: 'text-cyan-600 dark:text-cyan-400' },
  'ssc': { gradient: 'from-amber-600 via-orange-500 to-amber-600', accent: 'text-amber-600 dark:text-amber-400' },
  'hsc': { gradient: 'from-rose-600 via-pink-500 to-rose-600', accent: 'text-rose-600 dark:text-rose-400' },
}

function getSubjectIcon(icon: string | undefined | null): React.ReactNode {
  return <BookOpen className="size-6" />
}

function ErrorState({ message, onRetry, onGoBack }: { message: string; onRetry?: () => void; onGoBack: () => void }) {
  const msg = getMessages()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <BookOpen className="size-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{msg.contentLoadError}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && <Button onClick={onRetry} variant="default" className="gap-2">আবার চেষ্টা করুন</Button>}
          <Button onClick={onGoBack} variant="outline" className="gap-2"><ArrowLeft className="size-4" />ফিরে যান</Button>
        </div>
      </Card>
    </div>
  )
}

function EmptyState({ onGoBack }: { onGoBack: () => void }) {
  const msg = getMessages()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <BookOpen className="size-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{msg.contentComingSoon}</h2>
        <p className="text-muted-foreground mb-6">{msg.subjectsComingSoon}</p>
        <Button onClick={onGoBack} variant="outline" className="gap-2"><ArrowLeft className="size-4" />ফিরে যান</Button>
      </Card>
    </div>
  )
}

export default function ClassDetailPage() {
  const { params, navigate, goBack } = useRouterStore()
  const msg = getMessages()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const slug = params.classSlug
      if (!slug) {
        setError('ক্লাস তথ্য পাওয়া যায়নি')
        setLoading(false)
        return
      }
      const res = await fetch(`/api/classes/${slug}`)
      if (!res.ok) throw new Error('ক্লাস ডাটা লোড করতে সমস্যা হয়েছে')
      const data = await res.json()
      setClassData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : msg.contentLoadError)
    } finally {
      setLoading(false)
    }
  }, [params.classSlug])

  useEffect(() => { fetchData() }, [fetchData])

  const theme = CLASS_THEMES[classData?.slug || ''] || CLASS_THEMES['class-6']

  // Handle subject chip click — navigate directly to that tab
  const handleChipClick = (subject: Subject, tabKey: string) => {
    navigate('subject-detail', {
      subjectId: subject.id,
      subjectSlug: subject.slug,
      classSlug: classData?.slug || '',
      initialTab: tabKey,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="max-w-6xl mx-auto px-4 -mt-16">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={fetchData} onGoBack={goBack} />
  if (!classData || classData.subjects.length === 0) return <EmptyState onGoBack={goBack} />

  const co = classData.contentOverview

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className={`relative h-44 sm:h-52 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent)]" />
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{classData.name}</h1>
            {classData.description && (
              <div className="text-white/80 text-sm sm:text-base mb-3 max-w-md"><RichContentRenderer content={classData.description} /></div>
            )}
            <p className="text-white/70 text-xs sm:text-sm">
              {toBn(classData.subjects.length)}টি বিষয় • সম্পূর্ণ পাঠ্যক্রম
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Overview */}
      {co && (co.totalLectures + co.totalMcqs + co.totalCqs + co.totalBoardQuestions) > 0 && (
        <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: 'লেকচার', count: co.totalLectures, icon: PlayCircle, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
              { label: 'MCQ', count: co.totalMcqs, icon: FileQuestion, color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
              { label: 'সৃজনশীল', count: co.totalCqs, icon: ClipboardList, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
              { label: 'বোর্ড প্রশ্ন', count: co.totalBoardQuestions, icon: GraduationCap, color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
            ].map((stat) => {
              const StatIcon = stat.icon
              return (
                <div key={stat.label} className={`${stat.color} rounded-xl p-3 sm:p-4 flex items-center gap-3 shadow-sm`}>
                  <StatIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <div>
                    <p className="text-lg sm:text-xl font-bold">{toBn(stat.count)}</p>
                    <p className="text-xs opacity-70">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-list')}>শ্রেণি</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{classData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Subject Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-5">বিষয়সমূহ</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {classData.subjects.map((subject) => (
            <motion.div key={subject.id} variants={item}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Subject Header */}
                  <div className="p-4 sm:p-5 pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`${subject.color || 'bg-emerald-500'} p-2.5 rounded-xl text-white shrink-0 group-hover:scale-110 transition-transform`}>
                        {getSubjectIcon(subject.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {toBn(subject.chapterCount)}টি অধ্যায়
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content counts */}
                  {subject.contentCounts && (
                    <div className="px-4 sm:px-5 pb-3">
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {subject.contentCounts.lectures > 0 && (
                          <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <PlayCircle className="w-3 h-3" />{toBn(subject.contentCounts.lectures)} লেকচার
                          </span>
                        )}
                        {subject.contentCounts.mcqs > 0 && (
                          <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <FileQuestion className="w-3 h-3" />{toBn(subject.contentCounts.mcqs)} MCQ
                          </span>
                        )}
                        {subject.contentCounts.cqs > 0 && (
                          <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                            <ClipboardList className="w-3 h-3" />{toBn(subject.contentCounts.cqs)} সৃজনশীল
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Chips — direct navigation */}
                  <div className="px-4 sm:px-5 pb-4 border-t border-border/30 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {CONTENT_CHIPS.map((chip) => {
                        const ChipIcon = chip.icon
                        const count = chip.key === 'lecture'
                          ? subject.contentCounts?.lectures
                          : chip.key === 'mcq'
                          ? subject.contentCounts?.mcqs
                          : chip.key === 'cq'
                          ? subject.contentCounts?.cqs
                          : subject.contentCounts?.boardQuestions

                        if (!count || count === 0) return null

                        return (
                          <button
                            key={chip.key}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleChipClick(subject, chip.tabKey)
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${chip.color}`}
                          >
                            <ChipIcon className="w-3 h-3" />
                            {chip.label}
                          </button>
                        )
                      })}
                      {/* Fallback if no content chips */}
                      {(!subject.contentCounts || (
                        subject.contentCounts.lectures + subject.contentCounts.mcqs +
                        subject.contentCounts.cqs + subject.contentCounts.boardQuestions
                      ) === 0) && (
                        <span className="text-xs text-muted-foreground">শীঘ্রই আসছে</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
