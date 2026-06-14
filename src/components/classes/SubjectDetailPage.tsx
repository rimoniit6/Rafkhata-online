'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronRight, ChevronDown, GraduationCap, ArrowLeft, FileText, PlayCircle,
  Lightbulb, Crown, Eye, Lock, CheckCircle2, Loader2, MapPin, Calendar,
  FileQuestion, ClipboardList, Clock, Brain, BookOpenCheck, Award,
  Sparkles, ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useContentTypes } from '@/hooks/use-content-types'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getMessages } from '@/lib/messages'
import { cn } from '@/lib/utils'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

// ============ INTERFACES ============

interface Chapter {
  id: string
  name: string
  number: number
  lectureCount: number
  mcqCount: number
  cqCount: number
  freeLectureCount: number
  freeMcqCount: number
  freeCqCount: number
  suggestionCount: number
  examCount: number
  progress: number
}

interface SubjectData {
  id: string
  name: string
  className: string
  classSlug: string
  chapters: Chapter[]
  boardQuestions: { board: string; year: string; count: number }[]
  mcqPracticeCount: number
  contentCounts: Record<string, number>
  freeContentCounts: Record<string, number>
}

interface CQQuestion {
  id: string
  label: string
  number: number
  text: string
  marks: number
  answer: string
  questionImage?: string | null
  answerImage?: string | null
}

interface CQDetailItem {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  questions: CQQuestion[]
  chapterName: string
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
  chapterId: string
  isPremium: boolean
  price: number
  difficulty: string
  year?: string
  board?: string
}

interface SuggestionRecord {
  id: string
  title: string
  thumbnail: string | null
  isPremium: boolean
  price: number | null
  viewCount: number
  className?: string | null
  subjectName?: string | null
  chapterName?: string | null
  chapterId: string | null
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

interface ExamListItem {
  id: string
  title: string
  description: string | null
  classLevel: string
  type: string
  duration: number
  totalMarks: number
  isPremium: boolean
  price: number
  totalQuestions: number
}

interface BoardQuestionItem {
  id: string
  type: 'mcq' | 'cq'
  board: string
  year: string
  classLevel: string
  subjectId: string
  chapterId: string
  subjectName: string
  chapterName: string
  title: string
  isPremium: boolean
  price: number
  difficulty: string
  questionCount: number
}

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

// ============ CONTENT PILL CONFIGURATION ============

interface PillConfigItem {
  key: string
  label: string
  Icon: LucideIcon
  colorKey: string
  hasSubFilter?: boolean
}

const CONTENT_PILLS: PillConfigItem[] = [
  { key: 'lecture', label: 'লেকচার', Icon: PlayCircle, colorKey: 'emerald' },
  { key: 'cq', label: 'সৃজনশীল', Icon: ClipboardList, colorKey: 'amber', hasSubFilter: true },
  { key: 'mcq', label: 'MCQ প্র্যাকটিস', Icon: FileQuestion, colorKey: 'teal' },
  { key: 'suggestion', label: 'সাজেশন', Icon: Lightbulb, colorKey: 'violet' },
  { key: 'exam', label: 'পরীক্ষা', Icon: Award, colorKey: 'sky' },
  { key: 'board', label: 'বোর্ড প্রশ্ন', Icon: GraduationCap, colorKey: 'rose' },
]

// Keep TAB_CONFIG for legacy lookups in render helpers
interface TabConfigItem {
  key: string
  label: string
  Icon: LucideIcon
  colorKey: string
}

const TAB_CONFIG: TabConfigItem[] = [
  { key: 'lecture', label: 'লেকচার', Icon: PlayCircle, colorKey: 'emerald' },
  { key: 'knowledge', label: 'জ্ঞানমূলক', Icon: Brain, colorKey: 'cyan' },
  { key: 'understanding', label: 'অনুধাবন', Icon: BookOpenCheck, colorKey: 'indigo' },
  { key: 'cq', label: 'সৃজনশীল প্রশ্ন', Icon: ClipboardList, colorKey: 'amber' },
  { key: 'mcq', label: 'MCQ প্র্যাকটিস', Icon: FileQuestion, colorKey: 'teal' },
  { key: 'suggestion', label: 'সাজেশন', Icon: Lightbulb, colorKey: 'violet' },
  { key: 'exam', label: 'পরীক্ষা', Icon: Award, colorKey: 'sky' },
  { key: 'board', label: 'বোর্ড প্রশ্ন', Icon: GraduationCap, colorKey: 'rose' },
]

interface TabColorTheme {
  bg: string
  text: string
  border: string
  leftBorder: string
  lightBg: string
}

const TAB_COLORS: Record<string, TabColorTheme> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    leftBorder: 'bg-emerald-500',
    lightBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    leftBorder: 'bg-cyan-500',
    lightBg: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    leftBorder: 'bg-indigo-500',
    lightBg: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    leftBorder: 'bg-amber-500',
    lightBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    leftBorder: 'bg-teal-500',
    lightBg: 'bg-teal-100 dark:bg-teal-900/30',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    leftBorder: 'bg-violet-500',
    lightBg: 'bg-violet-100 dark:bg-violet-900/30',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    leftBorder: 'bg-sky-500',
    lightBg: 'bg-sky-100 dark:bg-sky-900/30',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    leftBorder: 'bg-rose-500',
    lightBg: 'bg-rose-100 dark:bg-rose-900/30',
  },
}

// Pill-specific active color classes for the pill button
const PILL_ACTIVE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-600 dark:bg-emerald-500', text: 'text-white', ring: 'ring-emerald-300 dark:ring-emerald-700' },
  amber: { bg: 'bg-amber-600 dark:bg-amber-500', text: 'text-white', ring: 'ring-amber-300 dark:ring-amber-700' },
  teal: { bg: 'bg-teal-600 dark:bg-teal-500', text: 'text-white', ring: 'ring-teal-300 dark:ring-teal-700' },
  violet: { bg: 'bg-violet-600 dark:bg-violet-500', text: 'text-white', ring: 'ring-violet-300 dark:ring-violet-700' },
  sky: { bg: 'bg-sky-600 dark:bg-sky-500', text: 'text-white', ring: 'ring-sky-300 dark:ring-sky-700' },
  rose: { bg: 'bg-rose-600 dark:bg-rose-500', text: 'text-white', ring: 'ring-rose-300 dark:ring-rose-700' },
}

// ============ ANIMATION VARIANTS ============

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
}

const expandVariants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' as const },
  visible: { opacity: 1, height: 'auto', overflow: 'hidden' as const, transition: { duration: 0.35, ease: 'easeInOut' } },
  exit: { opacity: 0, height: 0, overflow: 'hidden' as const, transition: { duration: 0.25, ease: 'easeInOut' } },
} as const

// ============ HELPER COMPONENTS ============

// Board color dot helper — maps a color string (from Board model) to a Tailwind bg class
function getBoardColorDot(color: string): string {
  const map: Record<string, string> = {
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
  }
  return map[color] || 'bg-rose-500'
}

function EffectWrapper({ callback }: { callback: () => void }) {
  useEffect(() => { callback() }, [callback])
  return null
}

function ComingSoonEmptyState({ title, subtitle }: { title?: string; subtitle?: string }) {
  const msg = getMessages()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-5">
        <BookOpen className="size-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title || msg.contentTypeSoon}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{subtitle || msg.chaptersComingSoon}</p>
    </motion.div>
  )
}

// ============ MAIN COMPONENT ============

export default function SubjectDetailPage() {
  const { params, navigate } = useRouterStore()
  const { user } = useAuthStore()
  const { loading: ctLoading } = useContentTypes()
  const hierarchyMeta = useHierarchyMetadata()
  const msg = getMessages()

  // Subject data
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pill & chapter navigation
  const [activePill, setActivePill] = useState<string>('lecture')
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  // CQ sub-filter mode (for সৃজনশীল pill: 'all' = ক+খ সম্পূর্ণ, 'knowledge' = ক জ্ঞানমূলক, 'understanding' = খ অনুধাবন)
  const [cqSubMode, setCqSubMode] = useState<'all' | 'knowledge' | 'understanding'>('all')

  // CQ data (for knowledge & understanding sub-modes — per chapter)
  const [chapterCqs, setChapterCqs] = useState<CQDetailItem[]>([])
  const [chapterCqsLoading, setChapterCqsLoading] = useState(false)
  const [cqPurchaseMap, setCqPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Suggestion data (per chapter or subject-level)
  const [chapterSuggestions, setChapterSuggestions] = useState<SuggestionRecord[]>([])
  const [chapterSuggestionsLoading, setChapterSuggestionsLoading] = useState(false)
  const [suggestionPurchaseMap, setSuggestionPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [subjectSuggestions, setSubjectSuggestions] = useState<SuggestionRecord[]>([])
  const [subjectSuggestionsLoading, setSubjectSuggestionsLoading] = useState(false)
  const [subjectSuggestionsFetched, setSubjectSuggestionsFetched] = useState(false)

  // Exam data (per chapter)
  const [chapterExams, setChapterExams] = useState<ExamListItem[]>([])
  const [chapterExamsLoading, setChapterExamsLoading] = useState(false)
  const [examPurchaseMap, setExamPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Board questions (subject-level, fetched once)
  const [boardQuestions, setBoardQuestions] = useState<BoardQuestionItem[]>([])
  const [boardQuestionsLoading, setBoardQuestionsLoading] = useState(false)
  const [boardQuestionsFetched, setBoardQuestionsFetched] = useState(false)
  const [boardPurchaseMap, setBoardPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [expandedBoardRow, setExpandedBoardRow] = useState<string | null>(null)

  // Lecture data (per chapter)
  const [chapterLectures, setChapterLectures] = useState<LectureListItem[]>([])
  const [chapterLecturesLoading, setChapterLecturesLoading] = useState(false)
  const [lecturePurchaseMap, setLecturePurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Purchase modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  // Pill scroll ref
  const pillScrollRef = useRef<HTMLDivElement>(null)

  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()

  // Bengali number converter
  const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

  // ============ FETCH SUBJECT DATA ============
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const id = params.subjectId || '1'
        const res = await fetch(`/api/subjects/${id}`)
        if (!res.ok) throw new Error('বিষয়ের ডাটা লোড করতে সমস্যা হয়েছে')
        const data = await res.json()
        setSubjectData(data)
      } catch {
        setError(msg.contentLoadError)
        setSubjectData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.subjectId, params.classSlug])

  // ============ DETERMINE VISIBLE PILLS ============
  // Merge knowledge+understanding+cq counts for the "cq" pill
  const visiblePills = useMemo(() => {
    if (!subjectData) return []
    const cc = subjectData.contentCounts || {}
    const result = CONTENT_PILLS.filter(pill => {
      if (pill.key === 'cq') {
        // Show if any of cq, knowledge, understanding have content
        return (cc.cq ?? 0) > 0 || (cc.knowledge ?? 0) > 0 || (cc.understanding ?? 0) > 0
      }
      return (cc[pill.key] ?? 0) > 0
    })
    return result
  }, [subjectData])

  // Get count for a pill (for the pill badge)
  const getPillCount = useCallback((pillKey: string): number => {
    if (!subjectData) return 0
    const cc = subjectData.contentCounts || {}
    if (pillKey === 'cq') {
      return (cc.cq ?? 0) + (cc.knowledge ?? 0) + (cc.understanding ?? 0)
    }
    return cc[pillKey] ?? 0
  }, [subjectData])

  // Default pill: first visible pill
  const defaultPill = visiblePills.length > 0 ? visiblePills[0].key : 'lecture'

  // Set initial active pill when subject data loads
  // Also support `initialTab` param from ClassDetailPage chip clicks
  // NOTE: activePill is intentionally excluded from deps to avoid resetting
  // the pill when the user manually switches — this effect should only run
  // when subject data / visible pills change (i.e. on initial load or navigation).
  useEffect(() => {
    if (subjectData && visiblePills.length > 0) {
      const initialTab = params.initialTab as string | undefined
      if (initialTab && visiblePills.find(p => p.key === initialTab)) {
        setActivePill(initialTab)
      } else {
        setActivePill(defaultPill)
      }
    }
  }, [subjectData, visiblePills, defaultPill, params.initialTab])

  // ============ GET CHAPTERS FOR PILL ============
  const getChaptersForPill = useCallback((pillKey: string): Chapter[] => {
    if (!subjectData) return []
    switch (pillKey) {
      case 'lecture': return subjectData.chapters.filter(ch => ch.lectureCount > 0)
      case 'cq': return subjectData.chapters.filter(ch => ch.cqCount > 0)
      case 'mcq': return subjectData.chapters.filter(ch => ch.mcqCount > 0)
      case 'board': {
        const chapterIdsWithBoardQs = new Set(boardQuestions.map(q => q.chapterId))
        return subjectData.chapters.filter(ch => chapterIdsWithBoardQs.has(ch.id))
      }
      case 'suggestion': return subjectData.chapters.filter(ch => ch.suggestionCount > 0)
      case 'exam': return subjectData.chapters.filter(ch => ch.examCount > 0)
      default: return subjectData.chapters
    }
  }, [subjectData, boardQuestions])

  // ============ GET COUNT FOR CHAPTER IN PILL ============
  const getChapterCountForPill = (chapter: Chapter, pillKey: string): number => {
    switch (pillKey) {
      case 'lecture': return chapter.lectureCount
      case 'cq': return chapter.cqCount
      case 'mcq': return chapter.mcqCount
      case 'board': return boardQuestions.filter(q => q.chapterId === chapter.id).length
      case 'suggestion': return chapter.suggestionCount
      case 'exam': return chapter.examCount
      default: return 0
    }
  }

  // Check if a chapter has free content for the active pill
  const chapterHasFreeContent = (chapter: Chapter, pillKey: string): boolean => {
    switch (pillKey) {
      case 'lecture': return chapter.freeLectureCount > 0
      case 'cq': return chapter.freeCqCount > 0
      case 'mcq': return chapter.freeMcqCount > 0
      default: return false
    }
  }

  // Check if a chapter has premium-only content
  const chapterIsPremiumOnly = (chapter: Chapter, pillKey: string): boolean => {
    const count = getChapterCountForPill(chapter, pillKey)
    return count > 0 && !chapterHasFreeContent(chapter, pillKey)
  }

  // ============ FETCH CQS FOR CHAPTER ============
  const fetchChapterCqs = useCallback(async (chapterId: string) => {
    setChapterCqsLoading(true)
    setChapterCqs([])
    setCqPurchaseMap({})
    try {
      const res = await fetch(`/api/cq?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setChapterCqs(json.data?.cqs || [])
      }
    } catch {
      setChapterCqs([])
    } finally {
      setChapterCqsLoading(false)
    }
  }, [])

  // ============ FETCH SUGGESTIONS FOR CHAPTER ============
  const fetchChapterSuggestions = useCallback(async (chapterId: string) => {
    setChapterSuggestionsLoading(true)
    setChapterSuggestions([])
    setSuggestionPurchaseMap({})
    try {
      const res = await fetch(`/api/suggestions?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setChapterSuggestions(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      setChapterSuggestions([])
    } finally {
      setChapterSuggestionsLoading(false)
    }
  }, [])

  // ============ FETCH EXAMS FOR CHAPTER ============
  const fetchChapterExams = useCallback(async (chapterId: string, subjectId: string) => {
    setChapterExamsLoading(true)
    setChapterExams([])
    setExamPurchaseMap({})
    try {
      const res = await fetch(`/api/exams?chapterId=${chapterId}&subjectId=${subjectId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setChapterExams(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      setChapterExams([])
    } finally {
      setChapterExamsLoading(false)
    }
  }, [])

  // ============ FETCH LECTURES FOR CHAPTER ============
  const fetchChapterLectures = useCallback(async (chapterId: string) => {
    setChapterLecturesLoading(true)
    setChapterLectures([])
    setLecturePurchaseMap({})
    try {
      const res = await fetch(`/api/lectures?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setChapterLectures(json.data?.lectures || [])
      }
    } catch {
      setChapterLectures([])
    } finally {
      setChapterLecturesLoading(false)
    }
  }, [])

  // ============ FETCH BOARD QUESTIONS ============
  const fetchBoardQuestions = useCallback(async (subjectId: string) => {
    if (boardQuestionsFetched) return
    setBoardQuestionsLoading(true)
    try {
      const res = await fetch(`/api/board-questions?subjectId=${subjectId}&limit=100`)
      if (res.ok) {
        const json = await res.json()
        setBoardQuestions(Array.isArray(json.data) ? json.data : [])
        setBoardQuestionsFetched(true)
      }
    } catch {
      setBoardQuestions([])
    } finally {
      setBoardQuestionsLoading(false)
    }
  }, [boardQuestionsFetched])

  // ============ BATCH PURCHASE CHECKS ============

  // CQ purchases
  useEffect(() => {
    if (!user?.id || chapterCqs.length === 0) return
    const premiumItems = chapterCqs.filter(cq => cq.isPremium)
    if (premiumItems.length === 0) return
    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(cq => ({ contentType: 'cq', contentId: cq.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setCqPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [chapterCqs, user?.id])

  // Suggestion purchases
  useEffect(() => {
    if (!user?.id || chapterSuggestions.length === 0) return
    const premiumItems = chapterSuggestions.filter(s => s.isPremium)
    if (premiumItems.length === 0) return
    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(s => ({ contentType: 'suggestion', contentId: s.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setSuggestionPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [chapterSuggestions, user?.id])

  // Exam purchases
  useEffect(() => {
    if (!user?.id || chapterExams.length === 0) return
    const premiumItems = chapterExams.filter(e => e.isPremium)
    if (premiumItems.length === 0) return
    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(e => ({ contentType: 'exam', contentId: e.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setExamPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [chapterExams, user?.id])

  // Board purchases
  useEffect(() => {
    if (!user?.id || boardQuestions.length === 0) return
    const premiumItems = boardQuestions.filter(q => q.isPremium)
    if (premiumItems.length === 0) return
    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(q => ({ contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq', contentId: q.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setBoardPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [boardQuestions, user?.id])

  // Lecture purchases
  useEffect(() => {
    if (!user?.id || chapterLectures.length === 0) return
    const premiumItems = chapterLectures.filter(l => l.isPremium)
    if (premiumItems.length === 0) return
    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(l => ({ contentType: 'lecture', contentId: l.id })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const it of items) {
            newMap[it.contentId] = { purchased: it.purchased || false, pendingPayment: it.pendingPayment || false }
          }
          setLecturePurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [chapterLectures, user?.id])

  // ============ ACCESS LEVEL HELPERS ============

  const isBoardQuestionLocked = (q: BoardQuestionItem) => {
    return q.isPremium && !isPremiumUser && !boardPurchaseMap[q.id]?.purchased
  }

  // Separate CQs by access level
  const { freeCqs, purchasedCqs, lockedCqs } = useMemo(() => {
    const free: CQDetailItem[] = []
    const purchased: CQDetailItem[] = []
    const locked: CQDetailItem[] = []
    for (const cq of chapterCqs) {
      if (!cq.isPremium || isPremiumUser) free.push(cq)
      else if (cqPurchaseMap[cq.id]?.purchased) purchased.push(cq)
      else locked.push(cq)
    }
    return { freeCqs: free, purchasedCqs: purchased, lockedCqs: locked }
  }, [chapterCqs, isPremiumUser, cqPurchaseMap])

  // Separate suggestions by access level
  const { freeSuggestions, purchasedSuggestions, pendingSuggestions, lockedSuggestions } = useMemo(() => {
    const free: SuggestionRecord[] = []
    const purchased: SuggestionRecord[] = []
    const pending: SuggestionRecord[] = []
    const locked: SuggestionRecord[] = []
    for (const s of chapterSuggestions) {
      if (!s.isPremium || isPremiumUser) free.push(s)
      else if (suggestionPurchaseMap[s.id]?.purchased) purchased.push(s)
      else if (suggestionPurchaseMap[s.id]?.pendingPayment) pending.push(s)
      else locked.push(s)
    }
    return { freeSuggestions: free, purchasedSuggestions: purchased, pendingSuggestions: pending, lockedSuggestions: locked }
  }, [chapterSuggestions, isPremiumUser, suggestionPurchaseMap])

  // Separate exams by access level
  const { freeExams, purchasedExams, lockedExams } = useMemo(() => {
    const free: ExamListItem[] = []
    const purchased: ExamListItem[] = []
    const locked: ExamListItem[] = []
    for (const e of chapterExams) {
      if (!e.isPremium || isPremiumUser) free.push(e)
      else if (examPurchaseMap[e.id]?.purchased) purchased.push(e)
      else locked.push(e)
    }
    return { freeExams: free, purchasedExams: purchased, lockedExams: locked }
  }, [chapterExams, isPremiumUser, examPurchaseMap])

  const boardMcqs = useMemo(() => boardQuestions.filter(q => q.type === 'mcq'), [boardQuestions])
  const boardCqs = useMemo(() => boardQuestions.filter(q => q.type === 'cq'), [boardQuestions])

  // Group board questions by year then by board (for year-based timeline view)
  const boardYearGroups = useMemo(() => {
    const chapterBoardQuestions = boardQuestions.filter(q => q.chapterId === selectedChapterId)
    if (chapterBoardQuestions.length === 0) return []
    const groups: Record<string, Record<string, BoardQuestionItem[]>> = {}
    for (const q of chapterBoardQuestions) {
      const year = q.year || 'unknown'
      const board = q.board || 'unknown'
      if (!groups[year]) groups[year] = {}
      if (!groups[year][board]) groups[year][board] = []
      groups[year][board].push(q)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, boardGroups]) => ({
        year,
        boards: Object.entries(boardGroups)
          .map(([board, questions]) => ({
            board,
            mcqCount: questions.filter(q => q.type === 'mcq').length,
            cqCount: questions.filter(q => q.type === 'cq').length,
            questions,
          }))
      }))
  }, [boardQuestions, selectedChapterId])

  // Separate lectures by access level
  const { freeLectures, purchasedLectures, lockedLectures } = useMemo(() => {
    const free: LectureListItem[] = []
    const purchased: LectureListItem[] = []
    const locked: LectureListItem[] = []
    for (const l of chapterLectures) {
      if (!l.isPremium || isPremiumUser) free.push(l)
      else if (lecturePurchaseMap[l.id]?.purchased) purchased.push(l)
      else locked.push(l)
    }
    return { freeLectures: free, purchasedLectures: purchased, lockedLectures: locked }
  }, [chapterLectures, isPremiumUser, lecturePurchaseMap])

  // ============ SELECTED CHAPTER ============
  const selectedChapter = useMemo(() => {
    if (!selectedChapterId || !subjectData) return null
    return subjectData.chapters.find(ch => ch.id === selectedChapterId) || null
  }, [selectedChapterId, subjectData])

  // ============ PRE-FETCH BOARD QUESTIONS ON PILL ACTIVATION ============
  useEffect(() => {
    if (activePill === 'board' && subjectData && !boardQuestionsFetched && !boardQuestionsLoading) {
      fetchBoardQuestions(subjectData.id)
    }
  }, [activePill, subjectData, boardQuestionsFetched, boardQuestionsLoading, fetchBoardQuestions])

  // ============ PILL & CHAPTER HANDLERS ============
  const handlePillChange = (pillKey: string) => {
    setActivePill(pillKey)
    setSelectedChapterId(null)
    if (pillKey === 'cq') {
      setCqSubMode('all')
    }
  }

  const handleChapterExpand = (chapterId: string) => {
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(null)
      return
    }
    setSelectedChapterId(chapterId)
    if (activePill === 'lecture') {
      fetchChapterLectures(chapterId)
    } else if (activePill === 'cq') {
      fetchChapterCqs(chapterId)
    } else if (activePill === 'suggestion') {
      fetchChapterSuggestions(chapterId)
    } else if (activePill === 'exam' && subjectData) {
      fetchChapterExams(chapterId, subjectData.id)
    } else if (activePill === 'board' && subjectData) {
      fetchBoardQuestions(subjectData.id)
    }
  }

  const handleBackToChapters = () => {
    setSelectedChapterId(null)
  }

  // ============ CONTENT SUMMARY STATS (for hero) ============
  const contentSummaryStats = useMemo(() => {
    if (!subjectData) return []
    const cc = subjectData.contentCounts || {}
    const stats: { label: string; count: number }[] = []
    if ((cc.lecture ?? 0) > 0) stats.push({ label: 'লেকচার', count: cc.lecture })
    if ((cc.cq ?? 0) > 0 || (cc.knowledge ?? 0) > 0 || (cc.understanding ?? 0) > 0) {
      stats.push({ label: 'সৃজনশীল', count: (cc.cq ?? 0) + (cc.knowledge ?? 0) + (cc.understanding ?? 0) })
    }
    if ((cc.mcq ?? 0) > 0) stats.push({ label: 'MCQ', count: cc.mcq })
    if ((cc.suggestion ?? 0) > 0) stats.push({ label: 'সাজেশন', count: cc.suggestion })
    if ((cc.exam ?? 0) > 0) stats.push({ label: 'পরীক্ষা', count: cc.exam })
    if ((cc.board ?? 0) > 0) stats.push({ label: 'বোর্ড প্রশ্ন', count: cc.board })
    return stats
  }, [subjectData])

  // ============ LOADING STATE ============
  if (loading || ctLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============ ERROR STATE ============
  if (!subjectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="flex items-center justify-center size-20 rounded-2xl bg-red-100 dark:bg-red-950/30 mb-6">
            <BookOpen className="size-10 text-red-600 dark:text-red-400" />
          </div>
          {error ? (
            <>
              <h2 className="text-xl font-bold mb-2">{msg.contentLoadError}</h2>
              <p className="text-sm text-destructive mb-4">{error}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">{msg.contentComingSoon}</h2>
              <p className="text-sm text-muted-foreground mb-1">{msg.chaptersComingSoon}</p>
            </>
          )}
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('home')}>
            <ArrowLeft className="size-4" />
            ফিরে যান
          </Button>
        </motion.div>
      </div>
    )
  }

  // ============ RENDER HELPERS ============

  // Back button for inline content views
  const renderBackButton = (label: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 mb-4 -ml-2"
      onClick={handleBackToChapters}
    >
      <ArrowLeft className="size-4" />
      {label} — অধ্যায় তালিকায় ফিরে যান
    </Button>
  )

  // ============ CQ CARD (knowledge/understanding sub-mode) ============
  const renderCQCard = (
    cq: CQDetailItem,
    mode: 'knowledge' | 'understanding',
    accessLevel: 'free' | 'purchased' | 'locked',
    colors: TabColorTheme,
    tabLabel: string,
  ) => {
    const isLocked = accessLevel === 'locked'
    const questionsToShow = mode === 'knowledge'
      ? cq.questions.filter(q => q.number === 1)
      : cq.questions.filter(q => q.number === 2)
    const borderColor = accessLevel === 'free' ? 'bg-green-500' : accessLevel === 'purchased' ? 'bg-emerald-500' : 'bg-amber-500'
    const cardBorder = accessLevel === 'purchased'
      ? 'border-emerald-200 dark:border-emerald-800'
      : accessLevel === 'locked'
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
        : 'border-border/50'

    return (
      <Card
        key={cq.id}
        className={cn(
          'relative overflow-hidden transition-all',
          isLocked && 'cursor-pointer hover:shadow-md',
          cardBorder,
        )}
        onClick={() => {
          if (isLocked) {
            setPurchaseModalData({
              contentType: 'cq',
              contentId: cq.id,
              contentTitle: `${cq.chapterName} - ${tabLabel}`,
              contentPrice: cq.price,
              classLevel: cq.classSlug,
            })
            setPurchaseModalOpen(true)
          }
        }}
      >
        <div className={cn('absolute left-0 top-0 bottom-0 w-1', borderColor)} />
        <CardContent className="p-4 pl-5">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {accessLevel === 'free' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1">
                  <Eye className="size-3" /> ফ্রি
                </Badge>
              )}
              {accessLevel === 'purchased' && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1">
                  <CheckCircle2 className="size-3" /> কেনা
                </Badge>
              )}
              {accessLevel === 'locked' && (
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                    <Lock className="size-3" /> প্রিমিয়াম
                  </Badge>
                  {cq.price > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{cq.price}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {questionsToShow.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className={cn('inline-flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0', colors.bg, colors.text)}>
                    {question.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                  {question.questionImage && (
                    <SafeImage src={question.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                  )}
                  </div>
                  {question.marks > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                  )}
                </div>
                {/* Answer */}
                {!isLocked && question.answer && (
                  <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                    <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                  {question.answerImage && (
                    <SafeImage src={question.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
                  )}
                  </div>
                )}
                {isLocked && (
                  <div className="ml-8 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                    <Lock className="size-3 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">উত্তর দেখতে প্রিমিয়াম কিনুন</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============ CQ CONTENT (knowledge/understanding sub-mode) ============
  const renderCQSubModeContent = (mode: 'knowledge' | 'understanding') => {
    const tabConfig = TAB_CONFIG.find(t => t.key === mode)
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.cyan
    const tabLabel = tabConfig?.label || ''

    if (chapterCqsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterCqs.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle={`এই অধ্যায়ের ${tabLabel} শীঘ্রই যোগ করা হবে`}
        />
      )
    }

    return (
      <div className="space-y-4">
        {/* Free CQs */}
        {freeCqs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                ফ্রি ({toBengaliNum(freeCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {freeCqs.map((cq) => renderCQCard(cq, mode, 'free', colors, tabLabel))}
            </div>
          </div>
        )}
        {/* Purchased CQs */}
        {purchasedCqs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                কেনা ({toBengaliNum(purchasedCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {purchasedCqs.map((cq) => renderCQCard(cq, mode, 'purchased', colors, tabLabel))}
            </div>
          </div>
        )}
        {/* Locked CQs */}
        {lockedCqs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                প্রিমিয়াম ({toBengaliNum(lockedCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {lockedCqs.map((cq) => renderCQCard(cq, mode, 'locked', colors, tabLabel))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ SUGGESTION CONTENT ============
  const renderSuggestionContent = () => {
    const tabConfig = TAB_CONFIG.find(t => t.key === 'suggestion')
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.violet
    const tabLabel = tabConfig?.label || ''

    if (chapterSuggestionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterSuggestions.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle={`এই অধ্যায়ের ${tabLabel} শীঘ্রই যোগ করা হবে`}
        />
      )
    }

    return (
      <div className="space-y-3">
        {/* Free Suggestions */}
        {freeSuggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">ফ্রি সাজেশন ({toBengaliNum(freeSuggestions.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {freeSuggestions.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-border/50" onClick={() => navigate('suggestion-detail', { suggestionId: s.id })}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 shrink-0">
                        <Lightbulb className="size-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.title}</p>
                        {s.chapterName && <p className="text-xs text-muted-foreground">{s.chapterName}</p>}
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Purchased Suggestions */}
        {purchasedSuggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা সাজেশন ({toBengaliNum(purchasedSuggestions.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {purchasedSuggestions.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-emerald-200 dark:border-emerald-800" onClick={() => navigate('suggestion-detail', { suggestionId: s.id })}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                        <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.title}</p>
                        {s.chapterName && <p className="text-xs text-muted-foreground">{s.chapterName}</p>}
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Locked Suggestions */}
        {lockedSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম সাজেশন ({toBengaliNum(lockedSuggestions.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {lockedSuggestions.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10" onClick={() => {
                  setPurchaseModalData({
                    contentType: 'suggestion',
                    contentId: s.id,
                    contentTitle: s.title,
                    contentPrice: s.price || 0,
                    classLevel: subjectData.classSlug,
                  })
                  setPurchaseModalOpen(true)
                }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 shrink-0">
                        <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.title}</p>
                        {s.chapterName && <p className="text-xs text-muted-foreground">{s.chapterName}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Crown className="size-3" /> প্রিমিয়াম</Badge>
                        {s.price && s.price > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">৳{s.price}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ EXAM CONTENT ============
  const renderExamContent = () => {
    const tabConfig = TAB_CONFIG.find(t => t.key === 'exam')
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.sky
    const tabLabel = tabConfig?.label || ''

    if (chapterExamsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterExams.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle={`এই অধ্যায়ের ${tabLabel} শীঘ্রই যোগ করা হবে`}
        />
      )
    }

    return (
      <div className="space-y-3">
        {/* Free Exams */}
        {freeExams.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">ফ্রি পরীক্ষা ({toBengaliNum(freeExams.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {freeExams.map((e) => (
                <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-border/50" onClick={() => navigate('exam-center', { examId: e.id, chapterId: selectedChapterId || undefined, subjectId: subjectData.id, classSlug: subjectData.classSlug })}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 shrink-0">
                        <Award className="size-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-300 text-green-700 dark:text-green-400">
                            {e.type === 'mcq' ? 'MCQ' : e.type === 'cq' ? 'সৃজনশীল' : 'মিশ্র'}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {toBengaliNum(e.duration)} মি.
                          </span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalMarks)} নম্বর</span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalQuestions)} প্রশ্ন</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Purchased Exams */}
        {purchasedExams.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা পরীক্ষা ({toBengaliNum(purchasedExams.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {purchasedExams.map((e) => (
                <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-emerald-200 dark:border-emerald-800" onClick={() => navigate('exam-center', { examId: e.id, chapterId: selectedChapterId || undefined, subjectId: subjectData.id, classSlug: subjectData.classSlug })}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                        <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 dark:text-emerald-400">
                            {e.type === 'mcq' ? 'MCQ' : e.type === 'cq' ? 'সৃজনশীল' : 'মিশ্র'}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {toBengaliNum(e.duration)} মি.
                          </span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalMarks)} নম্বর</span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalQuestions)} প্রশ্ন</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Locked Exams */}
        {lockedExams.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম পরীক্ষা ({toBengaliNum(lockedExams.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {lockedExams.map((e) => (
                <Card key={e.id} className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10" onClick={() => {
                  setPurchaseModalData({
                    contentType: 'exam',
                    contentId: e.id,
                    contentTitle: e.title,
                    contentPrice: e.price,
                    classLevel: e.classLevel,
                  })
                  setPurchaseModalOpen(true)
                }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <CardContent className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 shrink-0">
                        <Award className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400">
                            {e.type === 'mcq' ? 'MCQ' : e.type === 'cq' ? 'সৃজনশীল' : 'মিশ্র'}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {toBengaliNum(e.duration)} মি.
                          </span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalMarks)} নম্বর</span>
                          <span className="text-xs text-muted-foreground">{toBengaliNum(e.totalQuestions)} প্রশ্ন</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>
                        {e.price > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{e.price}</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ BOARD QUESTION CARD ============
  const renderBoardQuestionCard = (q: BoardQuestionItem, accessLevel: 'free' | 'purchased' | 'locked', colors: TabColorTheme) => {
    const isLocked = accessLevel === 'locked'
    const borderColor = accessLevel === 'free' ? 'bg-green-500' : accessLevel === 'purchased' ? 'bg-emerald-500' : 'bg-amber-500'
    const cardBorder = accessLevel === 'purchased'
      ? 'border-emerald-200 dark:border-emerald-800'
      : accessLevel === 'locked'
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
        : 'border-border/50'

    const handleClick = () => {
      if (isLocked) {
        setPurchaseModalData({
          contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
          contentId: q.id,
          contentTitle: `${q.board} বোর্ড - ${q.year} (${q.type === 'mcq' ? 'MCQ' : 'সৃজনশীল'})`,
          contentPrice: q.price,
          classLevel: q.classLevel,
        })
        setPurchaseModalOpen(true)
      } else if (q.type === 'mcq') {
        navigate('mcq-exam', { mcqId: q.id, classSlug: subjectData.classSlug, subjectId: subjectData.id, source: 'board' })
      } else {
        navigate('cq-viewer', { cqId: q.id, classSlug: subjectData.classSlug, subjectId: subjectData.id, source: 'board' })
      }
    }

    const IconComponent = q.type === 'mcq' ? FileQuestion : ClipboardList
    const typeLabel = q.type === 'mcq' ? 'MCQ' : 'সৃজনশীল'
    const typeBg = q.type === 'mcq' ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-amber-50 dark:bg-amber-950/30'
    const typeText = q.type === 'mcq' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'

    return (
      <Card
        key={q.id}
        className={cn('cursor-pointer hover:shadow-md transition-all relative overflow-hidden', cardBorder)}
        onClick={handleClick}
      >
        <div className={cn('absolute left-0 top-0 bottom-0 w-1', borderColor)} />
        <CardContent className="p-3 pl-5">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', typeBg)}>
              <IconComponent className={cn('size-4', typeText)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{q.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', typeBg, typeText, 'border-current/20')}>{typeLabel}</Badge>
                <MapPin className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{q.board} বোর্ড</span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{q.year}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {accessLevel === 'free' && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>
              )}
              {accessLevel === 'purchased' && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>
              )}
              {accessLevel === 'locked' && (
                <>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>
                  {q.price > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{q.price}</Badge>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============ BOARD CONTENT ============
  const renderBoardContent = () => {
    const tabConfig = TAB_CONFIG.find(t => t.key === 'board')
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.rose

    const chapterBoardQuestions = boardQuestions.filter(q => q.chapterId === selectedChapterId)

    if (boardQuestionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterBoardQuestions.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle="এই অধ্যায়ের বোর্ড প্রশ্ন শীঘ্রই যোগ করা হবে"
        />
      )
    }

    const yearGroups = boardYearGroups
    const boardColorMap = hierarchyMeta.boardColorMap
    const boardSlugToLabel = hierarchyMeta.boardSlugToLabel
    const latestYear = yearGroups.length > 0 ? yearGroups[0].year : null

    const getAccessLevel = (q: BoardQuestionItem): 'free' | 'purchased' | 'locked' => {
      if (!q.isPremium || isPremiumUser) return 'free'
      if (boardPurchaseMap[q.id]?.purchased) return 'purchased'
      return 'locked'
    }

    // Total stats
    const totalMcq = chapterBoardQuestions.filter(q => q.type === 'mcq').length
    const totalCq = chapterBoardQuestions.filter(q => q.type === 'cq').length

    return (
      <div className="space-y-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className={cn('p-1.5 rounded-lg', colors.bg)}>
            <GraduationCap className={cn('size-4', colors.text)} />
          </div>
          <h4 className="font-semibold text-rose-700 dark:text-rose-400">
            বোর্ড প্রশ্ন — {selectedChapter?.name || 'অধ্যায়'}
          </h4>
        </div>

        {/* Stats badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {totalMcq > 0 && (
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 gap-1">
              <FileQuestion className="size-3" /> MCQ {toBengaliNum(totalMcq)}টি
            </Badge>
          )}
          {totalCq > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
              <ClipboardList className="size-3" /> সৃজনশীল {toBengaliNum(totalCq)}টি
            </Badge>
          )}
        </div>

        {/* Year-based timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-300 via-rose-200 to-transparent dark:from-rose-700 dark:via-rose-800" />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {yearGroups.map((yearGroup) => {
              const isLatest = yearGroup.year === latestYear

              return (
                <motion.div
                  key={yearGroup.year}
                  variants={item}
                  className="relative pl-7"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-3.5 flex items-center justify-center">
                    <div className={cn(
                      'size-[22px] rounded-full border-2 z-10 flex items-center justify-center',
                      isLatest
                        ? 'bg-rose-500 border-rose-300 shadow-lg shadow-rose-500/30 dark:border-rose-600'
                        : 'bg-background border-rose-300 dark:border-rose-700'
                    )}>
                      {isLatest && <div className="size-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Year label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-foreground">{yearGroup.year}</span>
                    {isLatest && (
                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] gap-0.5 px-1.5">
                        <Sparkles className="size-3" /> নতুন!
                      </Badge>
                    )}
                  </div>

                  {/* Board rows */}
                  <div className="space-y-1.5 mb-3">
                    {yearGroup.boards.map((boardGroup) => {
                      const boardColor = boardColorMap[boardGroup.board] || 'rose'
                      const colorDotClass = getBoardColorDot(boardColor)
                      const boardName = boardSlugToLabel[boardGroup.board] || boardGroup.board
                      const rowKey = `${yearGroup.year}-${boardGroup.board}`
                      const isExpanded = expandedBoardRow === rowKey

                      return (
                        <motion.div
                          key={boardGroup.board}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.05 }}
                        >
                          <Card
                            className={cn(
                              'cursor-pointer hover:shadow-md transition-all border-border/50 overflow-hidden',
                              isExpanded && 'ring-1 ring-rose-200 dark:ring-rose-800',
                            )}
                            onClick={() => setExpandedBoardRow(isExpanded ? null : rowKey)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {/* Board color dot */}
                                  <div className={cn('size-3 rounded-full shrink-0', colorDotClass)} />
                                  {/* Board name */}
                                  <span className="font-medium text-sm truncate">{boardName} বোর্ড</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* MCQ count badge */}
                                  {boardGroup.mcqCount > 0 && (
                                    <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 text-[10px] px-1.5 py-0 gap-0.5 border-0">
                                      <FileQuestion className="size-2.5" /> {toBengaliNum(boardGroup.mcqCount)}
                                    </Badge>
                                  )}
                                  {/* CQ count badge */}
                                  {boardGroup.cqCount > 0 && (
                                    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] px-1.5 py-0 gap-0.5 border-0">
                                      <ClipboardList className="size-2.5" /> {toBengaliNum(boardGroup.cqCount)}
                                    </Badge>
                                  )}
                                  {/* Expand chevron */}
                                  <ChevronDown className={cn(
                                    'size-4 text-muted-foreground transition-transform duration-200',
                                    isExpanded && 'rotate-180',
                                  )} />
                                </div>
                              </div>
                            </CardContent>

                            {/* Expanded: individual questions */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  key={`expand-${rowKey}`}
                                  variants={expandVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                >
                                  <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2">
                                    {/* Free questions first */}
                                    {boardGroup.questions
                                      .filter(q => getAccessLevel(q) === 'free')
                                      .map(q => renderBoardQuestionCard(q, 'free', colors))}
                                    {/* Purchased questions */}
                                    {boardGroup.questions
                                      .filter(q => getAccessLevel(q) === 'purchased')
                                      .map(q => renderBoardQuestionCard(q, 'purchased', colors))}
                                    {/* Locked questions */}
                                    {boardGroup.questions
                                      .filter(q => getAccessLevel(q) === 'locked')
                                      .map(q => renderBoardQuestionCard(q, 'locked', colors))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* "সব বোর্ড প্রশ্ন দেখুন" link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-rose-200 dark:border-rose-800 overflow-hidden group"
            onClick={() => navigate('board-questions', {
              classSlug: subjectData.classSlug,
              classLevel: subjectData.classSlug,
              subjectId: subjectData.id,
            })}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                  <GraduationCap className={cn('size-4', colors.text)} />
                </div>
                <span className="font-medium text-sm text-rose-700 dark:text-rose-400">
                  সব বোর্ড প্রশ্ন দেখুন
                </span>
              </div>
              <ArrowRight className="size-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ============ LECTURE CONTENT ============
  const renderLectureContent = () => {
    const tabConfig = TAB_CONFIG.find(t => t.key === 'lecture')
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.emerald

    if (chapterLecturesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterLectures.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle="এই অধ্যায়ের লেকচার শীঘ্রই যোগ করা হবে"
        />
      )
    }

    const renderLectureCard = (lecture: LectureListItem, accessLevel: 'free' | 'purchased' | 'locked') => {
      const isLocked = accessLevel === 'locked'
      const borderColor = accessLevel === 'free' ? 'bg-green-500' : accessLevel === 'purchased' ? 'bg-emerald-500' : 'bg-amber-500'
      const cardBorder = accessLevel === 'purchased'
        ? 'border-emerald-200 dark:border-emerald-800'
        : accessLevel === 'locked'
          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
          : 'border-border/50'

      return (
        <Card
          key={lecture.id}
          className={cn(
            'cursor-pointer hover:shadow-md transition-all relative overflow-hidden',
            cardBorder,
          )}
          onClick={() => {
            if (isLocked) {
              setPurchaseModalData({
                contentType: 'lecture',
                contentId: lecture.id,
                contentTitle: lecture.title,
                contentPrice: lecture.price,
                classLevel: lecture.classSlug,
              })
              setPurchaseModalOpen(true)
            } else {
              navigate('lecture-viewer', {
                lectureId: lecture.id,
                chapterId: lecture.chapterId,
                subjectId: lecture.subjectId,
                classSlug: lecture.classSlug,
              })
            }
          }}
        >
          <div className={cn('absolute left-0 top-0 bottom-0 w-1', borderColor)} />
          <CardContent className="p-3 pl-5">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg shrink-0', colors.bg)}>
                <PlayCircle className={cn('size-4', colors.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{lecture.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {lecture.videoUrl && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-600 dark:text-red-400">
                      ভিডিও
                    </Badge>
                  )}
                  {lecture.pdfUrl && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 dark:text-blue-400">
                      PDF
                    </Badge>
                  )}
                  {lecture.duration > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {toBengaliNum(lecture.duration)} মি.
                    </span>
                  )}
                  {lecture.order > 0 && (
                    <span className="text-xs text-muted-foreground">#{toBengaliNum(lecture.order)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {accessLevel === 'free' && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>
                )}
                {accessLevel === 'purchased' && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>
                )}
                {accessLevel === 'locked' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>
                    {lecture.price > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">৳{lecture.price}</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {/* Free Lectures */}
        {freeLectures.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">ফ্রি লেকচার ({toBengaliNum(freeLectures.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {freeLectures.map((l) => renderLectureCard(l, 'free'))}
            </div>
          </div>
        )}
        {/* Purchased Lectures */}
        {purchasedLectures.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা লেকচার ({toBengaliNum(purchasedLectures.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {purchasedLectures.map((l) => renderLectureCard(l, 'purchased'))}
            </div>
          </div>
        )}
        {/* Locked Lectures */}
        {lockedLectures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম লেকচার ({toBengaliNum(lockedLectures.length)}টি)</span>
            </div>
            <div className="space-y-2">
              {lockedLectures.map((l) => renderLectureCard(l, 'locked'))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ CQ FULL CONTENT (ক+খ+গ+ঘ) ============
  const renderCQFullContent = () => {
    const tabConfig = TAB_CONFIG.find(t => t.key === 'cq')
    const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.amber
    const tabLabel = tabConfig?.label || ''

    if (chapterCqsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('size-8 animate-spin', colors.text)} />
        </div>
      )
    }

    if (chapterCqs.length === 0) {
      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle={`এই অধ্যায়ের ${tabLabel} শীঘ্রই যোগ করা হবে`}
        />
      )
    }

    const renderCQFullCard = (
      cq: CQDetailItem,
      accessLevel: 'free' | 'purchased' | 'locked',
    ) => {
      const isLocked = accessLevel === 'locked'
      const borderColor = accessLevel === 'free' ? 'bg-green-500' : accessLevel === 'purchased' ? 'bg-emerald-500' : 'bg-amber-500'
      const cardBorder = accessLevel === 'purchased'
        ? 'border-emerald-200 dark:border-emerald-800'
        : accessLevel === 'locked'
          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
          : 'border-border/50'

      return (
        <Card
          key={cq.id}
          className={cn(
            'relative overflow-hidden transition-all',
            isLocked && 'cursor-pointer hover:shadow-md',
            cardBorder,
          )}
          onClick={() => {
            if (isLocked) {
              setPurchaseModalData({
                contentType: 'cq',
                contentId: cq.id,
                contentTitle: `${cq.chapterName} - ${tabLabel}`,
                contentPrice: cq.price,
                classLevel: cq.classSlug,
              })
              setPurchaseModalOpen(true)
            }
          }}
        >
          <div className={cn('absolute left-0 top-0 bottom-0 w-1', borderColor)} />
          <CardContent className="p-4 pl-5">
            {/* Status badge and difficulty - moved to top */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {accessLevel === 'free' && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1">
                    <Eye className="size-3" /> ফ্রি
                  </Badge>
                )}
                {accessLevel === 'purchased' && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1">
                    <CheckCircle2 className="size-3" /> কেনা
                  </Badge>
                )}
                {accessLevel === 'locked' && (
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                      <Lock className="size-3" /> প্রিমিয়াম
                    </Badge>
                    {cq.price > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{cq.price}</Badge>
                    )}
                  </div>
                )}
              </div>
              {cq.difficulty && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cq.difficulty}</Badge>
              )}
            </div>

            {/* Uddeepok (stimulus) - moved after status badge */}
            {cq.uddeepok && (
              <div className="mb-3 p-2 rounded-lg bg-muted/50 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">উদ্দীপক</p>
                <RichContentRenderer content={cq.uddeepok} className="text-sm leading-relaxed" />
              </div>
            )}
            {cq.uddeepokImage && (
              <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-2 max-w-full rounded-lg border max-h-64" />
            )}

            {/* All questions (ক, খ, গ, ঘ) */}
            <div className="space-y-3">
              {cq.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={cn('inline-flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0', colors.bg, colors.text)}>
                      {question.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                    {question.questionImage && (
                      <SafeImage src={question.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                    )}
                    </div>
                    {question.marks > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                    )}
                  </div>
                  {/* Answer */}
                  {!isLocked && question.answer && (
                    <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                      <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                    {question.answerImage && (
                      <SafeImage src={question.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
                    )}
                    </div>
                  )}
                  {isLocked && (
                    <div className="ml-8 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                      <Lock className="size-3 text-amber-500" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">উত্তর দেখতে প্রিমিয়াম কিনুন</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {/* Free CQs */}
        {freeCqs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                ফ্রি ({toBengaliNum(freeCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {freeCqs.map((cq) => renderCQFullCard(cq, 'free'))}
            </div>
          </div>
        )}
        {/* Purchased CQs */}
        {purchasedCqs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                কেনা ({toBengaliNum(purchasedCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {purchasedCqs.map((cq) => renderCQFullCard(cq, 'purchased'))}
            </div>
          </div>
        )}
        {/* Locked CQs */}
        {lockedCqs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                প্রিমিয়াম ({toBengaliNum(lockedCqs.length)}টি)
              </span>
            </div>
            <div className="space-y-3">
              {lockedCqs.map((cq) => renderCQFullCard(cq, 'locked'))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ INLINE CONTENT FOR EXPANDED CHAPTER ============
  const renderInlineContent = () => {
    if (!selectedChapterId) return null

    return (
      <motion.div
        key={`content-${selectedChapterId}`}
        variants={expandVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="mt-3 border-t border-border/50 pt-4"
      >
        {/* Back to chapters button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4 -ml-2"
          onClick={handleBackToChapters}
        >
          <ArrowLeft className="size-4" />
          অধ্যায় তালিকায় ফিরে যান
        </Button>

        {/* Chapter header */}
        {selectedChapter && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{selectedChapter.name}</h3>
            <p className="text-sm text-muted-foreground">
              অধ্যায় {selectedChapter.number}
            </p>
          </div>
        )}

        {/* CQ sub-mode filter */}
        {activePill === 'cq' && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setCqSubMode('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                cqSubMode === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50'
              )}
            >
              ক+খ সম্পূর্ণ
            </button>
            <button
              onClick={() => setCqSubMode('knowledge')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                cqSubMode === 'knowledge'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/50'
              )}
            >
              ক জ্ঞানমূলক
            </button>
            <button
              onClick={() => setCqSubMode('understanding')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                cqSubMode === 'understanding'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50'
              )}
            >
              খ অনুধাবন
            </button>
          </div>
        )}

        {/* Content based on active pill and CQ sub-mode */}
        {activePill === 'lecture' && renderLectureContent()}
        {activePill === 'cq' && cqSubMode === 'all' && renderCQFullContent()}
        {activePill === 'cq' && cqSubMode === 'knowledge' && renderCQSubModeContent('knowledge')}
        {activePill === 'cq' && cqSubMode === 'understanding' && renderCQSubModeContent('understanding')}
        {activePill === 'suggestion' && renderSuggestionContent()}
        {activePill === 'exam' && renderExamContent()}
        {activePill === 'board' && renderBoardContent()}
      </motion.div>
    )
  }

  // ============ MCQ PRACTICE CONTENT (navigates away, no inline) ============
  const renderMcqPracticeContent = () => {
    const chapters = getChaptersForPill('mcq')
    if (chapters.length === 0) {
      return <ComingSoonEmptyState title={msg.contentTypeSoon} subtitle="এই বিষয়ের MCQ শীঘ্রই যোগ করা হবে" />
    }
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {chapters.map((chapter) => (
          <motion.div key={chapter.id} variants={item}>
            <Card
              className="cursor-pointer hover:shadow-md transition-all border-border/50"
              onClick={() => navigate('mcq-practice', {
                chapterId: chapter.id,
                subjectId: subjectData.id,
                classSlug: subjectData.classSlug,
              })}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 shrink-0">
                    <span className="font-bold text-lg">{chapter.number}</span>
                  </div>
                  <div>
                    <p className="font-medium">{chapter.name}</p>
                    <p className="text-sm text-muted-foreground">অধ্যায় {chapter.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 gap-1">
                    <FileQuestion className="size-3" />
                    {chapter.mcqCount}টি MCQ
                  </Badge>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  // ============ SUBJECT-LEVEL SUGGESTIONS (flat list fallback) ============
  const renderSubjectSuggestions = () => {
    if (getChaptersForPill('suggestion').length === 0 && subjectData.contentCounts?.suggestion > 0) {
      if (!subjectSuggestionsFetched && !subjectSuggestionsLoading) {
        setSubjectSuggestionsLoading(true)
        fetch(`/api/suggestions?subjectId=${subjectData.id}&limit=50`)
          .then(res => res.ok ? res.json() : { data: [] })
          .then(json => {
            setSubjectSuggestions(Array.isArray(json.data) ? json.data : [])
            setSubjectSuggestionsFetched(true)
          })
          .catch(() => setSubjectSuggestions([]))
          .finally(() => setSubjectSuggestionsLoading(false))
      }

      if (subjectSuggestionsLoading) {
        return (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-violet-500" />
          </div>
        )
      }

      if (subjectSuggestions.length > 0) {
        const tabConfig = TAB_CONFIG.find(t => t.key === 'suggestion')
        const colors = tabConfig ? TAB_COLORS[tabConfig.colorKey] : TAB_COLORS.violet
        return (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {[...freeSuggestions, ...purchasedSuggestions, ...pendingSuggestions, ...lockedSuggestions].map((s) => {
              const isFree = !s.isPremium || isPremiumUser
              const isPurchased = s.isPremium && suggestionPurchaseMap[s.id]?.purchased
              const isPending = suggestionPurchaseMap[s.id]?.pendingPayment && !isPurchased
              const isLocked = s.isPremium && !isPremiumUser && !isPurchased && !isPending
              const borderColor = isFree && !s.isPremium ? 'bg-green-500' : isPurchased ? 'bg-emerald-500' : isPending ? 'bg-yellow-500' : 'bg-amber-500'
              return (
                <motion.div key={s.id} variants={item}>
                  <Card
                    className={cn('cursor-pointer hover:shadow-md transition-all relative overflow-hidden',
                      isLocked ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10' :
                      isPending ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10' :
                      isPurchased ? 'border-emerald-200 dark:border-emerald-800' : 'border-border/50'
                    )}
                    onClick={() => navigate('suggestion-detail', { suggestionId: s.id })}
                  >
                    <div className={cn('absolute left-0 top-0 bottom-0 w-1', borderColor)} />
                    <CardContent className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg shrink-0', colors.bg)}>
                          <Lightbulb className={cn('size-4', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.title}</p>
                          {s.chapterName && <p className="text-xs text-muted-foreground">{s.chapterName}</p>}
                        </div>
                        <div className="shrink-0">
                          {!s.isPremium || isPremiumUser ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1"><Eye className="size-3" /> ফ্রি</Badge>
                          ) : isPending ? (
                            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs gap-1"><Clock className="size-3" /> অপেক্ষমাণ</Badge>
                          ) : isPurchased ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1"><CheckCircle2 className="size-3" /> কেনা</Badge>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1"><Lock className="size-3" /> প্রিমিয়াম</Badge>
                              {s.price && s.price > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{s.price}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )
      }

      return (
        <ComingSoonEmptyState
          title={msg.contentTypeSoon}
          subtitle="এই বিষয়ের সাজেশন শীঘ্রই যোগ করা হবে"
        />
      )
    }
    return null
  }

  // ============ MAIN RENDER ============
  const activePillConfig = CONTENT_PILLS.find(p => p.key === activePill)
  const activeColors = activePillConfig ? TAB_COLORS[activePillConfig.colorKey] : TAB_COLORS.emerald
  const chapters = getChaptersForPill(activePill)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Hero */}
      <div className="border-b border-border/50 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug: subjectData.classSlug })}>
                  {subjectData.className}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{subjectData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Subject name + class */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{subjectData.name}</h1>
              <p className="text-sm text-muted-foreground">{subjectData.className}</p>
            </div>
            {/* Content summary stats */}
            <div className="hidden sm:flex items-center gap-3 flex-wrap">
              {contentSummaryStats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg font-bold text-primary">{toBengaliNum(stat.count)}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Pills - Horizontal Scrollable */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4">
          <div
            ref={pillScrollRef}
            className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visiblePills.map(pill => {
              const PillIcon = pill.Icon
              const isActive = activePill === pill.key
              const pillColors = PILL_ACTIVE_COLORS[pill.colorKey] || PILL_ACTIVE_COLORS.emerald
              const count = getPillCount(pill.key)

              return (
                <button
                  key={pill.key}
                  onClick={() => handlePillChange(pill.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all shrink-0 snap-start',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isActive
                      ? cn(pillColors.bg, pillColors.text, `focus:${pillColors.ring}`, 'shadow-sm')
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring'
                  )}
                >
                  <PillIcon className="size-4" />
                  <span>{pill.label}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}>
                    {toBengaliNum(count)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 flex-1 w-full">
        {/* MCQ Practice — navigates away, no inline expansion */}
        {activePill === 'mcq' ? (
          renderMcqPracticeContent()
        ) : activePill === 'suggestion' && chapters.length === 0 ? (
          renderSubjectSuggestions()
        ) : chapters.length === 0 ? (
          <ComingSoonEmptyState
            title={msg.contentTypeSoon}
            subtitle={`এই বিষয়ের ${activePillConfig?.label || ''} শীঘ্রই যোগ করা হবে`}
          />
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isExpanded = selectedChapterId === chapter.id
              const hasFree = chapterHasFreeContent(chapter, activePill)
              const isPremiumOnly = chapterIsPremiumOnly(chapter, activePill)
              const count = getChapterCountForPill(chapter, activePill)
              const PillIcon = activePillConfig?.Icon || BookOpen

              return (
                <div key={chapter.id}>
                  <motion.div
                    layout
                    className="relative"
                  >
                    <Card
                      className={cn(
                        'cursor-pointer transition-all border-border/50 overflow-hidden',
                        isExpanded
                          ? cn('ring-1', activeColors.border, 'shadow-md')
                          : 'hover:shadow-md'
                      )}
                      onClick={() => handleChapterExpand(chapter.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Chapter number in colored circle */}
                            <div className={cn(
                              'flex items-center justify-center size-11 rounded-full shrink-0',
                              activeColors.bg, activeColors.text
                            )}>
                              <span className="font-bold text-lg">{chapter.number}</span>
                            </div>
                            <div>
                              <p className="font-medium">{chapter.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {/* Content count badge */}
                                <Badge className={cn(activeColors.lightBg, activeColors.text, 'gap-1 text-xs')}>
                                  <PillIcon className="size-3" />
                                  {toBengaliNum(count)}টি
                                </Badge>
                                {/* Free/Premium indicators */}
                                {hasFree && (
                                  <div className="flex items-center gap-1">
                                    <div className="size-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-green-600 dark:text-green-400">ফ্রি</span>
                                  </div>
                                )}
                                {isPremiumOnly && (
                                  <div className="flex items-center gap-1">
                                    <div className="size-2 rounded-full bg-amber-500" />
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400">প্রিমিয়াম</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Expand/collapse chevron */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="size-5 text-muted-foreground shrink-0" />
                          </motion.div>
                        </div>

                        {/* Progress bar - moved below the main content */}
                        {chapter.progress > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={cn('h-full rounded-full', activeColors.leftBorder)}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(chapter.progress, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' } as const}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{toBengaliNum(Math.round(chapter.progress))}%</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Inline expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        variants={expandVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="px-1 pb-2">
                          {renderInlineContent()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
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
