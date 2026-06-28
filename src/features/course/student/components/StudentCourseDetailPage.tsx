'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Crown, Clock, User, GraduationCap, BarChart3, Check, Loader2, Play,
  Award, FileQuestion, AlignLeft, StickyNote, Radio, Video, Target, ListChecks,
  Calendar, ChevronDown, ChevronUp, ExternalLink, Upload, FileText, Lock, Eye,
  MessageSquare, Star, PenSquare, CheckCircle, AlertCircle, FileUp, X, Paperclip,
  Layers, Menu, RefreshCw, FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useUploadThing } from '@/lib/uploadthing/client'
import { useStudentCourseDetail, type StudentTabId } from '../hooks/use-student-course-detail'
import { courseService } from '@/services/api/course.service'
import StudentSyllabusTab from './StudentSyllabusTab'
import StudentExamsTab from './StudentExamsTab'

interface Props {
  slug: string
}

const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

export default function StudentCourseDetailPage({ slug }: Props) {
  const { toast } = useToast()
  const h = useStudentCourseDetail(slug)
  const [purchasing, setPurchasing] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [activeSection, setActiveSection] = useState('curriculum')
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [submittingFor, setSubmittingFor] = useState<string | null>(null)
  const [submitContent, setSubmitContent] = useState('')
  const [submitFiles, setSubmitFiles] = useState<string>('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string; type: string }>>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [liveNow, setLiveNow] = useState<Set<string>>(new Set())
  const [timeLockedMap, setTimeLockedMap] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function updateTimestamps() {
      if (!h.course?.contents) return
      const bdOffset = 6 * 60
      const now = new Date()
      const bdNow = new Date(now.getTime() + bdOffset * 60 * 1000)
      const todayStr = bdNow.toISOString().split('T')[0]
      const currentMinutes = bdNow.getUTCHours() * 60 + bdNow.getUTCMinutes()
      const live = new Set<string>()
      const locked = new Set<string>()
      for (const item of h.course.contents) {
        if (item.releaseAt) {
          const dateStr = typeof item.releaseAt === 'string' ? item.releaseAt.split('T')[0] : null
          if (dateStr) {
            const startTime = item.scheduleStartTime || '00:00'
            const unlockAt = new Date(`${dateStr}T${startTime}:00`)
            if (unlockAt > bdNow) locked.add(item.id)
          }
        }
        if (item.contentType !== 'LIVE_CLASS') continue
        if (!item.releaseAt || !item.scheduleStartTime) continue
        const itemDate = typeof item.releaseAt === 'string' ? item.releaseAt.split('T')[0] : null
        if (!itemDate || itemDate !== todayStr) continue
        const [sh, sm] = item.scheduleStartTime.split(':').map(Number)
        const startMinutes = sh * 60 + sm
        let endMinutes = startMinutes + 60
        if (item.scheduleEndTime) {
          const [eh, em] = item.scheduleEndTime.split(':').map(Number)
          endMinutes = eh * 60 + em
        }
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          live.add(item.id)
        }
      }
      setLiveNow(live)
      setTimeLockedMap(locked)
    }
    updateTimestamps()
    const interval = setInterval(updateTimestamps, 60000)
    return () => clearInterval(interval)
  }, [h.course?.contents])

  const { startUpload: startAssignmentUpload } = useUploadThing('assignmentUploader', {
    onClientUploadComplete: (res) => {
      setUploadingFile(false)
      if (res && res.length > 0) {
        const newFiles = res.map(r => ({
          url: (r as any).ufsUrl ?? (r as any).url ?? '',
          name: (r as any).name ?? 'file',
          type: (r as any).type ?? 'image',
        }))
        setUploadedFiles(prev => [...prev, ...newFiles])
      } else {
        toast({ title: 'আপলোড ব্যর্থ', description: 'ফাইল আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    },
    onUploadError: () => {
      setUploadingFile(false)
      toast({ title: 'আপলোড ব্যর্থ', description: 'ফাইল আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    },
  })

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingFile(true)
    await startAssignmentUpload(Array.from(files))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [startAssignmentUpload])

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const isImageFile = useCallback((type: string) => {
    return type.startsWith('image/')
  }, [])

  const resetSubmission = useCallback(() => {
    setSubmittingFor(null)
    setSubmitContent('')
    setSubmitFiles('')
    setUploadedFiles([])
  }, [])

  function getUnlockLabel(item: any): string {
    if (!item.releaseAt) return ''
    try {
      const dateStr = typeof item.releaseAt === 'string' ? item.releaseAt.split('T')[0] : item.releaseAt
      const date = new Date(dateStr)
      const dayName = DAYS[date.getDay()]
      const formatted = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
      const time = item.scheduleStartTime || ''
      return time ? `${formatted} (${dayName}), ${time}` : `${formatted} (${dayName})`
    } catch {
      return ''
    }
  }
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const assignments = h.courseAssignments
  const assignmentsLoading = h.courseAssignmentsLoading

  async function handlePurchase() {
    setPurchasing(true)
    await h.purchase()
    setPurchasing(false)
  }

  async function handleEnroll() {
    setEnrolling(true)
    await h.enroll()
    setEnrolling(false)
    h.fetchDetail()
  }

  async function handleSubmitAssignment(assignmentId: string) {
    setSubmitLoading(true)
    const fileUrls = uploadedFiles.map(f => f.url).join(',')
    try {
      await courseService.submitAssignment(assignmentId, submitContent, fileUrls || undefined)
      toast({ title: 'অ্যাসাইনমেন্ট জমা দেওয়া হয়েছে', description: 'শিক্ষক যাচাই করে নম্বর দেবেন' })
      resetSubmission()
      h.fetchDetail()
    } catch {
      toast({ title: 'ত্রুটি', description: 'জমা দিতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally { setSubmitLoading(false) }
  }

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (h.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-64 rounded-2xl mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!h.course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-xl font-medium">কোর্স পাওয়া যায়নি</h2>
        </div>
      </div>
    )
  }

  const c = h.course
  const contents = (c.contents || []).sort((a: any, b: any) => a.displayOrder - b.displayOrder)
  const isCompleted = h.enrollment?.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">

      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {c.classCategory && (
                  <Badge variant="secondary" className="text-xs">{c.classCategory.name}</Badge>
                )}
                {c.subject && (
                  <Badge variant="outline" className="text-xs">{c.subject.name}</Badge>
                )}
                {c.isPremium ? (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                    <Crown className="mr-1 h-3 w-3" />প্রিমিয়াম
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">ফ্রি</Badge>
                )}
                {h.isEnrolled && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                    <Check className="mr-1 h-3 w-3" />এনরোলড
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{c.title}</h1>
              {c.description && <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{c.description}</p>}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {c.teacherName && (
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{c.teacherName}</span>
                )}
                {c.duration && (
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{c.duration} দিন</span>
                )}
                {c.difficulty && (
                  <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />{
                    c.difficulty === 'beginner' ? 'বিগিনার' : c.difficulty === 'advanced' ? 'এডভান্সড' : 'ইন্টারমিডিয়েট'
                  }</span>
                )}
                {c.hasCertificate && (
                  <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />সার্টিফিকেট</span>
                )}
                <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{h.totalContents}টি ক্লাস</span>
                {assignments.filter((a: any) => !a.submission).length > 0 && (
                  <span className="flex items-center gap-1.5"><PenSquare className="h-4 w-4" />{assignments.filter((a: any) => !a.submission).length}টি অ্যাসাইনমেন্ট বাকি</span>
                )}
              </div>
            </div>

            {c.thumbnail && (
              <div className="shrink-0 lg:w-80">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img src={c.thumbnail} alt={c.title} className="w-full aspect-video object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ===== MAIN CONTENT ===== */}
          <div className="lg:col-span-2 space-y-8">

            {/* Sticky Section Nav */}
            <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-lg border-b">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'curriculum', label: 'কারিকুলাম', icon: BookOpen },
                  { id: 'syllabus', label: 'সিলেবাস', icon: Layers },
                  { id: 'exams', label: 'পরীক্ষা', icon: FileQuestion },
                  { id: 'assignments', label: 'অ্যাসাইনমেন্ট', icon: PenSquare },
                  { id: 'overview', label: 'ওভারভিউ', icon: FileText },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id)
                      sectionRefs.current[s.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeSection === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ===== SECTION: Curriculum ===== */}
            <section ref={el => { sectionRefs.current['curriculum'] = el }} id="section-curriculum">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">কারিকুলাম</h2>
                  <p className="text-sm text-muted-foreground">{contents.length}টি ক্লাস • {assignments.length}টি অ্যাসাইনমেন্ট</p>
                </div>
              </div>

              {h.overallProgress.total > 0 && (
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">সামগ্রিক অগ্রগতি</span>
                    <span className="font-medium">{h.overallProgress.completed}/{h.overallProgress.total} ({h.overallProgress.percent}%)</span>
                  </div>
                  <Progress value={h.overallProgress.percent} className="h-2.5" />
                </div>
              )}

              {contents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p>কোনো কন্টেন্ট নেই</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {contents.map((item: any, idx: number) => {
                    const accessLocked = item.isPreview ? false : !h.hasAccess
                    const timeLocked = timeLockedMap.has(item.id)
                    const isLocked = accessLocked || timeLocked
                    const isCompleted = h.progress[item.id] || false
                    const itemAssignments = assignments.filter((a: any) => a.lessonId === item.id)
                    const isExpanded = expandedLessons.has(item.id)
                    const hasAssignments = itemAssignments.length > 0

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card
                          className={`transition-all cursor-pointer hover:shadow-md ${
                            isCompleted ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : ''
                          } ${isLocked ? 'opacity-60' : ''}`}
                          onClick={() => toggleLesson(item.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isCompleted ? 'bg-green-100 text-green-600' : timeLocked ? 'bg-amber-100 text-amber-600'
                                  : item.contentType === 'LIVE_CLASS' && liveNow.has(item.id) ? 'bg-red-100 text-red-600 animate-pulse'
                                    : 'bg-primary/10 text-primary'
                              }`}>
                                {isCompleted ? <CheckCircle className="h-5 w-5" /> : timeLocked ? <Clock className="h-5 w-5" />
                                  : item.contentType === 'LIVE_CLASS' && liveNow.has(item.id) ? <Radio className="h-5 w-5" />
                                    : <Video className="h-5 w-5" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium truncate ${isCompleted ? 'text-green-700 dark:text-green-400' : ''}`}>
                                    {item.title || `ক্লাস #${idx + 1}`}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] shrink-0 ${
                                      item.contentType === 'LIVE_CLASS' && liveNow.has(item.id)
                                        ? 'border-red-300 bg-red-100 text-red-700 animate-pulse dark:bg-red-900/30 dark:text-red-400'
                                        : ''
                                    }`}
                                  >
                                    <span className={`flex items-center gap-1 ${item.contentType === 'LIVE_CLASS' && liveNow.has(item.id) ? '' : ''}`}>
                                      {item.contentType === 'LIVE_CLASS' && liveNow.has(item.id) && (
                                        <span className="relative flex h-2 w-2">
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                                        </span>
                                      )}
                                      {item.contentType === 'LIVE_CLASS' ? 'লাইভ' : 'রেকর্ডেড'}
                                    </span>
                                  </Badge>
                                  {item.isPreview && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">ফ্রি</Badge>
                                  )}
                                  {hasAssignments && (
                                    <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600">
                                      {itemAssignments.filter((a: any) => !a.submission).length > 0 ? `${itemAssignments.filter((a: any) => !a.submission).length}টি অ্যাসাইনমেন্ট` : 'সম্পন্ন'}
                                    </Badge>
                                  )}
                                  {timeLocked && item.releaseAt && (
                                    <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-600">
                                      <Clock className="h-3 w-3 mr-0.5 inline" />
                                      {new Date(item.releaseAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                                {timeLocked && (
                                  <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                                    <Clock className="h-3 w-3 inline" />
                                    খোলা হবে: {getUnlockLabel(item)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {h.hasAccess && !timeLocked && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => { e.stopPropagation(); h.toggleProgress(item.id, !isCompleted) }}
                                    title={isCompleted ? 'অসম্পন্ন করুন' : 'সম্পন্ন করুন'}
                                  >
                                    {isCompleted ? <Eye className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                  </Button>
                                )}
                                {timeLocked ? (
                                  <Clock className="h-4 w-4 text-amber-500" />
                                ) : accessLocked ? (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                ) : item.contentType === 'LIVE_CLASS' ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (item.meetingLink) window.open(item.meetingLink, '_blank')
                                    }}
                                    title={item.platform ? `${item.platform}-এ যোগ দিন` : 'যোগ দিন'}
                                  >
                                    <Video className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const url = item.previewVideo || item.videoUrl
                                      if (url) window.open(url, '_blank')
                                    }}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>

                            {isExpanded && hasAssignments && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 pl-13 border-t pt-3 space-y-2"
                              >
                                {itemAssignments.map((as: any) => {
                                  const sub = as.submission
                                  return (
                                    <div key={as.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <PenSquare className="h-4 w-4 shrink-0 text-amber-600" />
                                          <span className="font-medium truncate">{as.title}</span>
                                          {sub && (
                                            <Badge className={`text-[10px] ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                              {sub.status === 'graded' ? `${sub.marks} নম্বর` : 'জমা দেওয়া হয়েছে'}
                                            </Badge>
                                          )}
                                        </div>
                                        {!sub && h.hasAccess && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0 h-8 text-xs"
                                            onClick={(e) => { e.stopPropagation(); setSubmittingFor(as.id); setSubmitContent(''); setUploadedFiles([]) }}
                                          >
                                            <Upload className="h-3 w-3 mr-1" />জমা দিন
                                          </Button>
                                        )}
                                      </div>
                                      {as.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{as.description}</p>
                                      )}
                                      {as.deadline && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          <Clock className="h-3 w-3 inline mr-0.5" />
                                          শেষ সময়: {new Date(as.deadline).toLocaleDateString('bn-BD')}
                                        </p>
                                      )}
                                      {sub?.feedback && (
                                        <div className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2 text-xs">
                                          <span className="font-medium text-blue-700 dark:text-blue-400">মতামত: </span>
                                          {sub.feedback}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </motion.div>
                            )}

                            {isExpanded && item.contentType === 'LIVE_CLASS' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 pl-13 border-t pt-3"
                              >
                                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                                  <div className="flex items-center gap-2 font-medium text-primary">
                                    <Video className="h-4 w-4" />
                                    <span>লাইভ ক্লাসের তথ্য</span>
                                  </div>
                                  {item.meetingLink && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">লিংক</span>
                                      <a href={item.meetingLink} target="_blank" rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 truncate max-w-[250px]"
                                      >
                                        {item.meetingLink} <ExternalLink className="h-3 w-3 shrink-0" />
                                      </a>
                                    </div>
                                  )}
                                  {item.platform && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">প্ল্যাটফর্ম</span>
                                      <span className="font-medium">{item.platform}</span>
                                    </div>
                                  )}
                                  {item.meetingId && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">মিটিং আইডি</span>
                                      <span className="font-medium">{item.meetingId}</span>
                                    </div>
                                  )}
                                  {item.password && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">পাসওয়ার্ড</span>
                                      <span className="font-medium">{item.password}</span>
                                    </div>
                                  )}
                                  {item.meetingLink && (
                                    <Button
                                      size="sm"
                                      className="w-full mt-1"
                                      onClick={(e) => { e.stopPropagation(); window.open(item.meetingLink!, '_blank') }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" /> যোগ দিন
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ===== SECTION: Syllabus ===== */}
            <section ref={el => { sectionRefs.current['syllabus'] = el }} id="section-syllabus">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">সিলেবাস ও পরীক্ষা</h2>
              </div>
              <StudentSyllabusTab
                courseId={c.id}
                rows={h.syllabusRows}
                summary={h.syllabusSummary}
                loading={h.syllabusLoading}
                hasAccess={h.hasAccess}
                progress={h.progress}
                onToggleProgress={h.toggleProgress}
                onLoad={h.loadSyllabus}
              />
            </section>

            {/* ===== SECTION: Assignments ===== */}
            <section ref={el => { sectionRefs.current['assignments'] = el }} id="section-assignments">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <PenSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">অ্যাসাইনমেন্ট</h2>
                  <p className="text-sm text-muted-foreground">
                    {assignments.filter((a: any) => a.submission?.status === 'graded').length}/{assignments.length}টি মূল্যায়ন হয়েছে
                  </p>
                </div>
              </div>

              {assignmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : !h.hasAccess ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Lock className="mx-auto mb-2 h-8 w-8" />
                    <p>কোর্সে এনরোল করে অ্যাসাইনমেন্ট জমা দিন</p>
                  </CardContent>
                </Card>
              ) : assignments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <PenSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p>কোনো অ্যাসাইনমেন্ট নেই</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assignments.map((as: any) => {
                    const sub = as.submission
                    return (
                      <motion.div key={as.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className={`transition-all ${sub?.status === 'graded' ? 'border-green-200' : ''}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  sub?.status === 'graded' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                  {sub?.status === 'graded' ? <CheckCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{as.title}</span>
                                    <Badge variant="outline" className="text-[10px]">{as.lessonTitle}</Badge>
                                    {sub?.status === 'graded' && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1">
                                        <Star className="h-3 w-3" />{sub.marks}
                                      </Badge>
                                    )}
                                  </div>
                                  {as.description && <p className="text-sm text-muted-foreground mt-1">{as.description}</p>}
                                  {as.deadline && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <Clock className="h-3 w-3 inline mr-0.5" />
                                      জমা দেওয়ার শেষ সময়: {new Date(as.deadline).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  )}
                                  {sub?.feedback && (
                                    <div className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                                      <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">শিক্ষকের মতামত:</p>
                                      <p className="text-muted-foreground">{sub.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {!sub ? (
                                  <Button
                                    onClick={() => { setSubmittingFor(as.id); setSubmitContent(''); setUploadedFiles([]) }}
                                    className="gap-1.5"
                                    size="sm"
                                  >
                                    <Upload className="h-4 w-4" />জমা দিন
                                  </Button>
                                ) : sub.status === 'graded' ? (
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{sub.marks}</p>
                                    <p className="text-xs text-muted-foreground">প্রাপ্ত নম্বর</p>
                                  </div>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">জমা দেওয়া হয়েছে</Badge>
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
            </section>

            {/* ===== SECTION: Exams ===== */}
            <section ref={el => { sectionRefs.current['exams'] = el }} id="section-exams">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">পরীক্ষা</h2>
                  <p className="text-sm text-muted-foreground">
                    {h.syllabusSummary ? (h.syllabusSummary.totalMcqExams + h.syllabusSummary.totalCqExams) : 0}টি পরীক্ষা
                  </p>
                </div>
              </div>

              {h.syllabusLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : h.examCalendar.length === 0 && h.syllabusRows.every(r => r.mcqExams.length === 0 && r.cqExams.length === 0) ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileQuestion className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p>এই কোর্সে কোনো পরীক্ষা নেই</p>
                  </CardContent>
                </Card>
              ) : (
                <StudentExamsTab
                  rows={h.syllabusRows}
                  examCalendar={h.examCalendar}
                  hasAccess={h.hasAccess}
                />
              )}
            </section>

            {/* ===== SECTION: Overview ===== */}
            <section ref={el => { sectionRefs.current['overview'] = el }} id="section-overview">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">কোর্স সম্পর্কে</h2>
              </div>

              {c.description && (
                <Card className="mb-4">
                  <CardContent className="p-5">
                    <p className="text-muted-foreground leading-relaxed">{c.description}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {c.features && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="flex items-center gap-2 font-semibold mb-3"><ListChecks className="h-4 w-4 text-primary" />কোর্স ফিচার</h3>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: c.features }} />
                    </CardContent>
                  </Card>
                )}
                {c.requirements && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="flex items-center gap-2 font-semibold mb-3"><Target className="h-4 w-4 text-primary" />প্রয়োজনীয়তা</h3>
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: c.requirements }} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {c.targetStudents && (
                <Card className="mt-4">
                  <CardContent className="p-5">
                    <h3 className="flex items-center gap-2 font-semibold mb-3"><User className="h-4 w-4 text-primary" />উদ্দেশ্য ছাত্র-ছাত্রী</h3>
                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: c.targetStudents }} />
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
              {/* CTA Card */}
              <Card className="overflow-hidden border-2">
                <CardContent className="p-6">
                  {c.isPremium && !h.hasAccess && (
                    <div className="text-center mb-5">
                      <p className="text-4xl font-bold text-amber-600">৳{c.price || 0}</p>
                      {(c as any).originalPrice > 0 && (c as any).originalPrice > (c.price || 0) && (
                        <p className="text-sm text-muted-foreground line-through">৳{(c as any).originalPrice}</p>
                      )}
                      <p className="text-sm text-muted-foreground">এককালীন পেমেন্ট</p>
                    </div>
                  )}

                  {h.pendingPayment ? (
                    <div className="text-center space-y-3 py-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                        <Clock className="h-8 w-8 text-amber-600" />
                      </div>
                      <p className="text-lg font-bold text-amber-600">পেমেন্ট অপেক্ষমাণ</p>
                      <p className="text-sm text-muted-foreground">আপনার পেমেন্ট অ্যাডমিন যাচাইয়ের পর অ্যাক্সেস সক্রিয় হবে।</p>
                      <Button variant="outline" size="sm" onClick={() => h.fetchDetail()}>
                        <RefreshCw className="h-4 w-4 mr-1" />স্ট্যাটাস চেক করুন
                      </Button>
                    </div>
                  ) : isCompleted ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">কোর্স সম্পন্ন হয়েছে</span>
                      </div>
                      {h.overallProgress.total > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">সামগ্রিক অগ্রগতি</span>
                            <span className="font-medium">{h.overallProgress.completed}/{h.overallProgress.total}</span>
                          </div>
                          <Progress value={h.overallProgress.percent} className="h-3" />
                          <p className="text-xs text-muted-foreground text-center">{h.overallProgress.percent}% সম্পন্ন</p>
                        </div>
                      )}
                    </div>
                  ) : h.isEnrolled ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">এনরোলড</span>
                      </div>
                      {h.overallProgress.total > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">সামগ্রিক অগ্রগতি</span>
                            <span className="font-medium">{h.overallProgress.completed}/{h.overallProgress.total}</span>
                          </div>
                          <Progress value={h.overallProgress.percent} className="h-3" />
                          <p className="text-xs text-muted-foreground text-center">{h.overallProgress.percent}% সম্পন্ন</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {c.isPremium ? (
                        <Button className="w-full gap-2 text-base" size="lg" onClick={handlePurchase} disabled={purchasing}>
                          {purchasing && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Crown className="h-5 w-5" />এখনই কিনুন
                        </Button>
                      ) : (
                        <Button className="w-full gap-2 text-base" size="lg" onClick={handleEnroll} disabled={enrolling}>
                          {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Play className="h-5 w-5" />এনরোল করুন
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">কুইক স্ট্যাটস</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'ক্লাস', value: h.totalContents, icon: Layers, color: 'text-blue-600 bg-blue-100' },
                      { label: 'MCQ', value: h.syllabusSummary?.totalMcqExams ?? '-', icon: FileQuestion, color: 'text-amber-600 bg-amber-100' },
                      { label: 'CQ', value: h.syllabusSummary?.totalCqExams ?? '-', icon: AlignLeft, color: 'text-purple-600 bg-purple-100' },
                      { label: 'অ্যাসাইনমেন্ট', value: assignments.length, icon: PenSquare, color: 'text-orange-600 bg-orange-100' },
                      { label: 'সম্পন্ন', value: h.overallProgress.completed, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
                      { label: 'অগ্রগতি', value: `${h.overallProgress.percent}%`, icon: BarChart3, color: 'text-rose-600 bg-rose-100' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                          <s.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-lg font-bold leading-tight">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Card */}
              {c.teacherName && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">শিক্ষক</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{c.teacherName}</p>
                        <p className="text-xs text-muted-foreground">কোর্স ইন্সট্রাক্টর</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== SUBMIT ASSIGNMENT DIALOG ===== */}
      <AnimatePresence>
        {submittingFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => resetSubmission()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-background shadow-2xl max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  অ্যাসাইনমেন্ট জমা দিন
                </h3>
                <Button variant="ghost" size="icon" onClick={() => resetSubmission()}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">উত্তর</label>
                  <Textarea
                    placeholder="আপনার উত্তর লিখুন..."
                    value={submitContent}
                    onChange={e => setSubmitContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">ফাইল (ছবি / PDF)</label>

                  {/* Upload button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <FileUp className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploadingFile ? 'আপলোড হচ্ছে...' : 'ছবি বা PDF নির্বাচন করুন'}
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <p className="text-xs text-muted-foreground">
                    একসাথে একাধিক ফাইল সিলেক্ট করতে পারেন। ছবি (8MB পর্যন্ত) ও PDF (16MB পর্যন্ত) সাপোর্টেড।
                  </p>

                  {/* Uploaded files preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="group relative rounded-lg border bg-muted/30 overflow-hidden">
                          {isImageFile(file.type) ? (
                            <div className="aspect-video relative">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video flex items-center justify-center bg-blue-50 dark:bg-blue-950/20">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                          )}
                          <div className="p-2 flex items-center justify-between gap-1">
                            <span className="text-[10px] truncate text-muted-foreground flex-1">{file.name}</span>
                            <button
                              onClick={() => removeUploadedFile(idx)}
                              className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => resetSubmission()}>বাতিল</Button>
                <Button
                  onClick={() => handleSubmitAssignment(submittingFor)}
                  disabled={submitLoading || uploadingFile || (!submitContent.trim() && uploadedFiles.length === 0)}
                  className="gap-2"
                >
                  {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Upload className="h-4 w-4" />জমা দিন
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
