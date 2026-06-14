'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Zap, ChevronRight, Lock, ArrowLeft, Crown,
  Eye, CheckCircle2, Loader2,
  ClipboardList, Lightbulb, FileText,
  GraduationCap, Clock, Brain, BookOpenCheck,
} from 'lucide-react'
import { useRouterStore, type RoutePath } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useContentTypes } from '@/hooks/use-content-types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { getMessages } from '@/lib/messages'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const PurchaseOptionsModal = dynamic(() => import('@/components/shared/PurchaseOptionsModal'))
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

// ─── Types ───

interface ChapterData {
  id: string
  name: string
  number: number
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
  lectureCount: number
  mcqCount: number
  cqCount: number
  boardQuestionCount: number
  progress: number
  contentCounts: Record<string, number>
  freeContentCounts: Record<string, number>
}

interface CQListItem {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  questionCount: number
  isPremium: boolean
  price: number
  difficulty: string
  board: string | null
  year: string | null
  chapterId: string
  chapterName: string
  subjectName: string
  className: string
  classSlug: string
  subjectId: string
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
  year: string | null
  board: string | null
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

interface ExamListItem {
  id: string
  title: string
  description: string | null
  classLevel: string
  type: string  // mcq, cq, mixed
  duration: number
  totalMarks: number
  isPremium: boolean
  price: number
  totalQuestions: number
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

interface KQItem {
  id: string
  question: string
  answer: string
  questionImage: string | null
  answerImage: string | null
  isPremium: boolean
  price: number
  order: number
}

// ─── Helpers ───

const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

// Content types that get their own dedicated tabs (not shown as cards in "কন্টেন্ট" tab)
const INLINE_TAB_KEYS = new Set(['cq', 'suggestion', 'knowledge', 'understanding', 'exam', 'short-questions'])

// Helper component to trigger a callback on mount (for lazy fetching)
function EffectWrapper({ callback }: { callback: () => void }) {
  useEffect(() => { callback() }, [callback])
  return null
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

function ComingSoonEmptyState({
  title,
  subtitle,
}: {
  title?: string
  subtitle?: string
}) {
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
      <p className="text-sm text-muted-foreground max-w-xs">{subtitle || msg.chapterContentSoon}</p>
    </motion.div>
  )
}

// ─── Component ───

export default function ChapterDetailPage() {
  const { params, navigate } = useRouterStore()
  const { user } = useAuthStore()
  const { contentTypesWithIcons, loading: ctLoading } = useContentTypes()
  const msg = getMessages()
  const [chapterData, setChapterData] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // CQ inline state (for সৃজনশীল প্রশ্ন tab — list view)
  const [cqs, setCqs] = useState<CQListItem[]>([])
  const [cqsLoading, setCqsLoading] = useState(false)
  const [cqsFetched, setCqsFetched] = useState(false)
  const [cqPurchaseMap, setCqPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Detail CQ state (for জ্ঞানমূলক & অনুধাবন tabs — with questions/answers)
  const [detailCqs, setDetailCqs] = useState<CQDetailItem[]>([])
  const [detailCqsLoading, setDetailCqsLoading] = useState(false)
  const [detailCqsFetched, setDetailCqsFetched] = useState(false)
  const [detailCqPurchaseMap, setDetailCqPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Suggestion inline state
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsFetched, setSuggestionsFetched] = useState(false)
  const [suggestionPurchaseMap, setSuggestionPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Exam inline state
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [examsFetched, setExamsFetched] = useState(false)
  const [examPurchaseMap, setExamPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  // Purchase modal state
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()

  // ─── Fetch chapter data ───
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const id = params.chapterId || '1'
        const res = await fetch(`/api/chapters/${id}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setChapterData(data)
      } catch {
        setError(msg.contentLoadError)
        setChapterData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.chapterId, params.classSlug, params.subjectId])

  // ─── Lazy fetch: CQs for this chapter (list view) ───
  const fetchCqs = useCallback(async (chapterId: string) => {
    if (cqsFetched) return
    setCqsLoading(true)
    try {
      const res = await fetch(`/api/cq?type=list&chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setCqs(json.data?.cqs || [])
        setCqsFetched(true)
      }
    } catch {
      setCqs([])
    } finally {
      setCqsLoading(false)
    }
  }, [cqsFetched])

  // ─── Lazy fetch: Detail CQs (with questions/answers for knowledge/understanding) ───
  const fetchDetailCqs = useCallback(async (chapterId: string) => {
    if (detailCqsFetched) return
    setDetailCqsLoading(true)
    try {
      const res = await fetch(`/api/cq?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setDetailCqs(json.data?.cqs || [])
        setDetailCqsFetched(true)
      }
    } catch {
      setDetailCqs([])
    } finally {
      setDetailCqsLoading(false)
    }
  }, [detailCqsFetched])

  // ─── Lazy fetch: Suggestions for this chapter ───
  const fetchSuggestions = useCallback(async (chapterId: string) => {
    if (suggestionsFetched) return
    setSuggestionsLoading(true)
    try {
      const res = await fetch(`/api/suggestions?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setSuggestions(Array.isArray(json.data) ? json.data : [])
        setSuggestionsFetched(true)
      }
    } catch {
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [suggestionsFetched])

  // ─── Lazy fetch: Exams (by chapterId) ───
  const fetchExams = useCallback(async (chapterId: string) => {
    if (examsFetched) return
    setExamsLoading(true)
    try {
      const res = await fetch(`/api/exams?chapterId=${chapterId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        setExams(Array.isArray(json.data) ? json.data : [])
        setExamsFetched(true)
      }
    } catch {
      setExams([])
    } finally {
      setExamsLoading(false)
    }
  }, [examsFetched])

  // ─── Batch check purchases: CQs (list) ───
  useEffect(() => {
    if (!user?.id || cqs.length === 0) return
    const premiumItems = cqs.filter(cq => cq.isPremium)
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
  }, [cqs, user?.id])

  // ─── Batch check purchases: Detail CQs (knowledge/understanding) ───
  useEffect(() => {
    if (!user?.id || detailCqs.length === 0) return
    const premiumItems = detailCqs.filter(cq => cq.isPremium)
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
          setDetailCqPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [detailCqs, user?.id])

  // ─── Batch check purchases: Suggestions ───
  useEffect(() => {
    if (!user?.id || suggestions.length === 0) return
    const premiumItems = suggestions.filter(s => s.isPremium)
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
  }, [suggestions, user?.id])

  // ─── Batch check purchases: Exams ───
  useEffect(() => {
    if (!user?.id || exams.length === 0) return
    const premiumItems = exams.filter(e => e.isPremium)
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
  }, [exams, user?.id])

  // ─── Separate CQs (list) by access level ───
  // প্রিমিয়াম কন্টেন্ট শুধুমাত্র যারা কিনবে তারা দেখবে
  const { freeCqs, purchasedCqs, lockedCqs } = useMemo(() => {
    const free: CQListItem[] = []
    const purchased: CQListItem[] = []
    const locked: CQListItem[] = []
    for (const cq of cqs) {
      if (!cq.isPremium) free.push(cq)
      else if (cqPurchaseMap[cq.id]?.purchased) purchased.push(cq)
      else locked.push(cq)
    }
    return { freeCqs: free, purchasedCqs: purchased, lockedCqs: locked }
  }, [cqs, cqPurchaseMap])

  // ─── Separate detail CQs by access level ───
  const { freeDetailCqs, purchasedDetailCqs, lockedDetailCqs } = useMemo(() => {
    const free: CQDetailItem[] = []
    const purchased: CQDetailItem[] = []
    const locked: CQDetailItem[] = []
    for (const cq of detailCqs) {
      if (!cq.isPremium) free.push(cq)
      else if (detailCqPurchaseMap[cq.id]?.purchased) purchased.push(cq)
      else locked.push(cq)
    }
    return { freeDetailCqs: free, purchasedDetailCqs: purchased, lockedDetailCqs: locked }
  }, [detailCqs, detailCqPurchaseMap])

  // ─── Separate suggestions by access level ───
  const { freeSuggestions, purchasedSuggestions, pendingSuggestions, lockedSuggestions } = useMemo(() => {
    const free: SuggestionRecord[] = []
    const purchased: SuggestionRecord[] = []
    const pending: SuggestionRecord[] = []
    const locked: SuggestionRecord[] = []
    for (const s of suggestions) {
      if (!s.isPremium) free.push(s)
      else if (suggestionPurchaseMap[s.id]?.purchased) purchased.push(s)
      else if (suggestionPurchaseMap[s.id]?.pendingPayment) pending.push(s)
      else locked.push(s)
    }
    return { freeSuggestions: free, purchasedSuggestions: purchased, pendingSuggestions: pending, lockedSuggestions: locked }
  }, [suggestions, suggestionPurchaseMap])

  // ─── Separate exams by access level ───
  const { freeExams, purchasedExams, lockedExams } = useMemo(() => {
    const free: ExamListItem[] = []
    const purchased: ExamListItem[] = []
    const locked: ExamListItem[] = []
    for (const e of exams) {
      if (!e.isPremium) free.push(e)
      else if (examPurchaseMap[e.id]?.purchased) purchased.push(e)
      else locked.push(e)
    }
    return { freeExams: free, purchasedExams: purchased, lockedExams: locked }
  }, [exams, examPurchaseMap])

  // ─── Short questions state ───
  const [shortQuestions, setShortQuestions] = useState<KQItem[]>([])
  const [shortQuestionsLoading, setShortQuestionsLoading] = useState(false)
  const [shortQuestionsFetched, setShortQuestionsFetched] = useState(false)
  const [shortQuestionPurchaseMap, setShortQuestionPurchaseMap] = useState<Record<string, PurchaseStatus>>({})

  const fetchShortQuestions = useCallback(async (chapterId: string) => {
    if (shortQuestionsFetched) return
    setShortQuestionsLoading(true)
    try {
      const res = await fetch(`/api/knowledge-questions?chapterId=${chapterId}`)
      if (res.ok) {
        const json = await res.json()
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setShortQuestions(data || [])
        setShortQuestionsFetched(true)
      }
    } catch {
      setShortQuestions([])
    } finally {
      setShortQuestionsLoading(false)
    }
  }, [shortQuestionsFetched])

  // ─── Batch check purchases: Short questions ───
  useEffect(() => {
    if (!user?.id || shortQuestions.length === 0) return
    const premiumItems = shortQuestions.filter(q => q.isPremium)
    if (premiumItems.length === 0) return

    const checkPurchases = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumItems.map(q => ({ contentType: 'short-questions', contentId: q.id })),
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
          setShortQuestionPurchaseMap(newMap)
        }
      } catch { /* silent */ }
    }
    checkPurchases()
  }, [shortQuestions, user?.id])

  // ─── Separate short questions by access level ───
  const { freeShortQuestions, purchasedShortQuestions, lockedShortQuestions } = useMemo(() => {
    const free: KQItem[] = []
    const purchased: KQItem[] = []
    const locked: KQItem[] = []
    for (const q of shortQuestions) {
      if (!q.isPremium) free.push(q)
      else if (shortQuestionPurchaseMap[q.id]?.purchased) purchased.push(q)
      else locked.push(q)
    }
    return { freeShortQuestions: free, purchasedShortQuestions: purchased, lockedShortQuestions: locked }
  }, [shortQuestions, shortQuestionPurchaseMap])

  // ─── Only show content types that are marked for chapter detail ───
  const chapterContentTypes = useMemo(() => {
    if (!chapterData) return []
    return contentTypesWithIcons.filter(ct => ct.showInChapterDetail)
  }, [contentTypesWithIcons, chapterData])

  // Navigational content types for "কন্টেন্ট" tab (exclude inline tab keys)
  const navigationalContentTypes = useMemo(() => {
    return chapterContentTypes.filter(ct => !INLINE_TAB_KEYS.has(ct.key))
  }, [chapterContentTypes])

  // ─── Build dynamic tabs ───
  const dynamicTabs = useMemo(() => {
    if (!chapterData) return []
    const tabs: { key: string; labelBn: string; count: number }[] = []

    // "কন্টেন্ট" tab — always show if any navigational content type has content
    const hasNavigational = navigationalContentTypes.some(ct => (chapterData.contentCounts?.[ct.key] ?? 0) > 0)
    if (hasNavigational) {
      tabs.push({ key: 'content', labelBn: 'কন্টেন্ট', count: 1 })
    }

    // "জ্ঞানমূলক" tab (shows CQ question 1 / ক)
    const knowledgeCount = chapterData.contentCounts?.['knowledge'] ?? 0
    if (knowledgeCount > 0) {
      tabs.push({ key: 'board-mcq', labelBn: 'জ্ঞানমূলক', count: knowledgeCount })
    }

    // "অনুধাবন" tab (shows CQ questions 1+2 / ক+খ)
    const understandingCount = chapterData.contentCounts?.['understanding'] ?? 0
    if (understandingCount > 0) {
      tabs.push({ key: 'board-cq', labelBn: 'অনুধাবন', count: understandingCount })
    }

    // "সংক্ষিপ্ত প্রশ্ন" tab
    const shortQuestionCount = chapterData.contentCounts?.['short-questions'] ?? 0
    if (shortQuestionCount > 0) {
      tabs.push({ key: 'short-questions', labelBn: 'সংক্ষিপ্ত প্রশ্ন', count: shortQuestionCount })
    }

    // "সাজেশন" tab
    const suggestionCount = chapterData.contentCounts?.['suggestion'] ?? 0
    if (suggestionCount > 0) {
      tabs.push({ key: 'suggestion', labelBn: 'সাজেশন', count: suggestionCount })
    }

    // "এক্সাম" tab
    const examCount = chapterData.contentCounts?.['exam'] ?? 0
    if (examCount > 0) {
      tabs.push({ key: 'exam', labelBn: 'এক্সাম', count: examCount })
    }

    return tabs
  }, [chapterData, navigationalContentTypes])

  const defaultTab = useMemo(() => {
    if (params.initialTab && dynamicTabs.some(t => t.key === params.initialTab)) return params.initialTab
    return dynamicTabs.length > 0 ? dynamicTabs[0].key : 'content'
  }, [dynamicTabs, params.initialTab])

  // ─── Loading skeleton ───
  if (loading || ctLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600" />
        <div className="max-w-4xl mx-auto px-4 -mt-10">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error / empty state ───
  if (!chapterData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />
        <div className="flex-1 flex items-center justify-center px-4 -mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className={`mx-auto mb-6 flex items-center justify-center size-20 rounded-2xl ${error ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
              <BookOpen className={`size-10 ${error ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {error ? msg.contentLoadError : msg.contentComingSoon}
            </h2>
            <p className="text-muted-foreground mb-6">
              {error || msg.chapterContentSoon}
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (params.classSlug && params.subjectId) {
                  navigate('subject-detail', {
                    subjectId: params.subjectId,
                    classSlug: params.classSlug,
                  })
                } else {
                  navigate('home')
                }
              }}
            >
              <ArrowLeft className="size-4" />
              ফিরে যান
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─── Helpers ───
  const getCount = (key: string): number => {
    return chapterData.contentCounts?.[key] ?? 0
  }

  const getFreeCount = (key: string): number => {
    return chapterData.freeContentCounts?.[key] ?? 0
  }

  const hasContent = (key: string): boolean => {
    return getCount(key) > 0
  }

  const getPremiumStatus = (key: string): 'all-free' | 'mixed' | 'all-premium' | 'empty' => {
    const total = getCount(key)
    const free = getFreeCount(key)
    if (total === 0) return 'empty'
    if (free === total) return 'all-free'
    if (free === 0) return 'all-premium'
    return 'mixed'
  }

  const openPurchaseModal = (contentType: string, contentId: string, contentTitle: string, contentPrice: number, classLevel: string) => {
    setPurchaseModalData({ contentType, contentId, contentTitle, contentPrice, classLevel })
    setPurchaseModalOpen(true)
  }

  // ─── Render CQ card for knowledge/understanding tabs ───
  const renderDetailCqCard = (
    cq: CQDetailItem,
    isLocked: boolean,
    accentColor: string,
    bgColor: string,
    textColor: string,
    icon: React.ReactNode,
    badge: React.ReactNode,
    showQuestions: (cq: CQDetailItem, isLocked: boolean) => React.ReactNode,
  ) => (
    <Card
      key={cq.id}
      className={cn(
        'transition-all relative overflow-hidden',
        isLocked
          ? 'cursor-pointer hover:shadow-md border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
          : 'hover:shadow-md border-border/50',
      )}
      onClick={isLocked ? () => openPurchaseModal('cq', cq.id, cq.uddeepok.length > 60 ? cq.uddeepok.slice(0, 60) + '...' : cq.uddeepok, cq.price, chapterData.classSlug) : undefined}
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', isLocked ? 'bg-amber-500' : accentColor)} />
      <CardContent className="p-4 pl-5">
        {/* Questions & Answers */}
        {showQuestions(cq, isLocked)}

        {/* Bottom row: badge + metadata */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{toBengaliNum(cq.questions.length)}টি প্রশ্ন</span>
            {cq.board && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>{cq.board} বোর্ড</span>
              </>
            )}
            {cq.year && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>{cq.year}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {isLocked && cq.price > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{cq.price}</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ─── Knowledge tab: show ক (question1) + answer1 only ───
  const renderKnowledgeQuestions = (cq: CQDetailItem, isLocked: boolean) => {
    const q1 = cq.questions.find(q => q.number === 1)
    if (!q1) return null
    return (
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-semibold text-cyan-700 dark:text-cyan-400">{q1.label}। </span>
          <RichContentRenderer content={q1.text} className="inline" inline />
        {q1.questionImage && (
          <SafeImage src={q1.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
        )}
        </div>
        {isLocked ? (
          <div className="relative">
            <div className="blur-sm select-none pointer-events-none text-sm bg-cyan-50 dark:bg-cyan-950/20 rounded p-2">
              <span>উত্তর প্রিমিয়াম কন্টেন্ট</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
                <Lock className="size-3" />
                উত্তর দেখতে প্রিমিয়াম কিনুন
              </div>
            </div>
          </div>
        ) : (
          q1.answer && (
            <div className="text-sm bg-cyan-50 dark:bg-cyan-950/20 rounded p-2">
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">উত্তর: </span>
              <RichContentRenderer content={q1.answer} className="inline" inline />
            {q1.answerImage && (
              <SafeImage src={q1.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
            )}
            </div>
          )
        )}
      </div>
    )
  }

  // ─── Understanding tab: show খ (question2) + answer2 only ───
  const renderUnderstandingQuestions = (cq: CQDetailItem, isLocked: boolean) => {
    const q2 = cq.questions.find(q => q.number === 2)
    return (
      <div className="space-y-2">
        {q2 && (
          <div className="text-sm">
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">{q2.label}। </span>
            <RichContentRenderer content={q2.text} className="inline" inline />
          {q2.questionImage && (
            <SafeImage src={q2.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
          )}
          </div>
        )}
        {q2 && (
          isLocked ? (
            <div className="relative">
              <div className="blur-sm select-none pointer-events-none text-sm bg-indigo-50 dark:bg-indigo-950/20 rounded p-2">
                <span>উত্তর প্রিমিয়াম কন্টেন্ট</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
                  <Lock className="size-3" />
                  উত্তর দেখতে প্রিমিয়াম কিনুন
                </div>
              </div>
            </div>
          ) : (
            q2.answer && (
              <div className="text-sm bg-indigo-50 dark:bg-indigo-950/20 rounded p-2">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">উত্তর: </span>
                <RichContentRenderer content={q2.answer} className="inline" inline />
              {q2.answerImage && (
                <SafeImage src={q2.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
              )}
              </div>
            )
          )
        )}
      </div>
    )
  }

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-emerald-200 text-sm mb-1">অধ্যায় {chapterData.number}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{chapterData.name}</h1>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug: chapterData.classSlug })}>
                {chapterData.className}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId: chapterData.subjectId, classSlug: chapterData.classSlug })}>
                {chapterData.subjectName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{chapterData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {dynamicTabs.length === 0 ? (
          <ComingSoonEmptyState
            title={msg.contentTypeSoon}
            subtitle={msg.chapterContentSoon}
          />
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full sm:w-auto flex-wrap">
              {dynamicTabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
                  {tab.key === 'content' && <BookOpen className="size-4" />}
                  {tab.key === 'board-mcq' && <FileText className="size-4" />}
                  {tab.key === 'board-cq' && <ClipboardList className="size-4" />}
                  {tab.key === 'short-questions' && <FileText className="size-4" />}
                  {tab.key === 'suggestion' && <Lightbulb className="size-4" />}
                  {tab.key === 'exam' && <GraduationCap className="size-4" />}
                  {tab.labelBn}
                  {tab.count > 0 && (
                    <Badge className="bg-primary/10 text-primary text-xs ml-1">{toBengaliNum(tab.count)}</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════ "কন্টেন্ট" Tab — navigational content type cards ═══════ */}
            <TabsContent value="content">
              {navigationalContentTypes.length === 0 ? (
                <ComingSoonEmptyState
                  title={msg.contentTypeSoon}
                  subtitle="এই অধ্যায়ের কন্টেন্ট শীঘ্রই যোগ করা হবে"
                />
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                >
                  {navigationalContentTypes.map((ct) => {
                    const count = getCount(ct.key)
                    const freeCount = getFreeCount(ct.key)
                    const Icon = ct.Icon
                    const premiumStatus = getPremiumStatus(ct.key)
                    const contentExists = hasContent(ct.key)

                    return (
                      <motion.div key={ct.key} variants={item}>
                        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                              <div className={`${ct.lightColor || 'bg-gray-50 dark:bg-gray-950/30'} p-3 rounded-xl shrink-0`}>
                                <Icon className={`size-7 ${ct.textColor || 'text-gray-600 dark:text-gray-400'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-lg">{ct.labelBn}</h3>
                                  {premiumStatus === 'all-premium' && contentExists && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); navigate((ct.route || ct.key) as RoutePath, { chapterId: chapterData.id, subjectId: chapterData.subjectId, classSlug: chapterData.classSlug }) }}>
                                      <Crown className="size-3" />
                                      প্রিমিয়াম
                                    </Badge>
                                  )}
                                  {premiumStatus === 'mixed' && contentExists && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); navigate((ct.route || ct.key) as RoutePath, { chapterId: chapterData.id, subjectId: chapterData.subjectId, classSlug: chapterData.classSlug }) }}>
                                      {freeCount}টি ফ্রি
                                    </Badge>
                                  )}
                                  {premiumStatus === 'all-free' && contentExists && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); navigate((ct.route || ct.key) as RoutePath, { chapterId: chapterData.id, subjectId: chapterData.subjectId, classSlug: chapterData.classSlug }) }}>
                                      ফ্রি
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1"><RichContentRenderer content={ct.description ?? ''} inline /></div>
                                {contentExists ? (
                                  <>
                                    <p className="text-2xl font-bold mt-2">{count}</p>
                                    <p className="text-xs text-muted-foreground">টি কন্টেন্ট</p>
                                    {premiumStatus === 'mixed' && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        (ফ্রি {freeCount}টি + প্রিমিয়াম {count - freeCount}টি)
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm mt-2 text-muted-foreground/80 italic">{msg.contentTypeSoon}</p>
                                )}
                              </div>
                            </div>
                            {contentExists ? (
                              <Button
                                className="w-full mt-4 gap-2"
                                variant={ct.key === 'lecture' ? 'default' : 'outline'}
                                onClick={() => {
                                  const navParams: Record<string, string> = {
                                    chapterId: chapterData.id,
                                    subjectId: chapterData.subjectId,
                                    classSlug: chapterData.classSlug,
                                  }
                                  navigate((ct.route || ct.key) as RoutePath, navParams)
                                }}
                              >
                                {ct.buttonLabel || ct.labelBn}
                                <ChevronRight className="size-4" />
                              </Button>
                            ) : (
                              <Button
                                className="w-full mt-4 gap-2"
                                variant="ghost"
                                disabled
                              >
                                {msg.contentTypeSoon}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {/* Quick Start - only show if MCQ content exists and has free items */}
              {getCount('mcq') > 0 && getFreeCount('mcq') > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
                    <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Zap className="size-8 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg">দ্রুত পরীক্ষা শুরু করুন</h3>
                          <p className="text-emerald-100 text-sm">এই অধ্যায়ের MCQ প্রশ্ন দিয়ে নিজেকে যাচাই করুন</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="shrink-0 gap-2"
                        onClick={() => navigate('mcq-practice', {
                          chapterId: chapterData.id,
                          subjectId: chapterData.subjectId,
                          classSlug: chapterData.classSlug,
                        })}
                      >
                        <BookOpen className="size-4" />
                        প্র্যাকটিস শুরু
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* ═══════ "জ্ঞানমূলক" Tab — CQs with ক + answer1 only ═══════ */}
            <TabsContent value="board-mcq">
              <div className="mt-4">
                {/* Fetch trigger */}
                {!detailCqsFetched && !detailCqsLoading && (
                  <EffectWrapper callback={() => fetchDetailCqs(chapterData.id)} />
                )}

                  {detailCqsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-8 animate-spin text-cyan-600" />
                    </div>
                  ) : detailCqs.length === 0 && getCount('knowledge') === 0 ? (
                      <ComingSoonEmptyState
                        title={msg.contentTypeSoon}
                        subtitle="এই অধ্যায়ের জ্ঞানমূলক প্রশ্ন শীঘ্রই যোগ করা হবে"
                      />
                ) : (
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {freeDetailCqs.length > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Eye className="size-3" /> ফ্রি {toBengaliNum(freeDetailCqs.length)}টি
                        </Badge>
                      )}
                      {purchasedDetailCqs.length > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <CheckCircle2 className="size-3" /> কেনা {toBengaliNum(purchasedDetailCqs.length)}টি
                        </Badge>
                      )}
                      {lockedDetailCqs.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Lock className="size-3" /> প্রিমিয়াম {toBengaliNum(lockedDetailCqs.length)}টি
                        </Badge>
                      )}
                    </div>

                    {/* Free CQs */}
                    {freeDetailCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-cyan-500" />
                          <span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">ফ্রি জ্ঞানমূলক প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {freeDetailCqs.map((cq) => renderDetailCqCard(
                            cq, false, 'bg-cyan-500', 'bg-cyan-50 dark:bg-cyan-950/30', 'text-cyan-600 dark:text-cyan-400',
                            <Brain className="size-4 text-cyan-600 dark:text-cyan-400" />,
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>,
                            renderKnowledgeQuestions,
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Purchased CQs */}
                    {purchasedDetailCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা জ্ঞানমূলক প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {purchasedDetailCqs.map((cq) => renderDetailCqCard(
                            cq, false, 'bg-emerald-500', 'bg-emerald-50 dark:bg-emerald-950/30', 'text-emerald-600 dark:text-emerald-400',
                            <Brain className="size-4 text-emerald-600 dark:text-emerald-400" />,
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>,
                            renderKnowledgeQuestions,
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locked CQs */}
                    {lockedDetailCqs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম জ্ঞানমূলক প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {lockedDetailCqs.map((cq) => renderDetailCqCard(
                            cq, true, 'bg-amber-500', 'bg-amber-50 dark:bg-amber-950/30', 'text-amber-600 dark:text-amber-400',
                            <Brain className="size-4 text-amber-600 dark:text-amber-400" />,
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>,
                            renderKnowledgeQuestions,
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ═══════ "অনুধাবন" Tab — CQs with ক+খ + answer1+answer2 ═══════ */}
            <TabsContent value="board-cq">
              <div className="mt-4">
                {/* Fetch trigger */}
                {!detailCqsFetched && !detailCqsLoading && (
                  <EffectWrapper callback={() => fetchDetailCqs(chapterData.id)} />
                )}

                {detailCqsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-indigo-600" />
                  </div>
                ) : detailCqs.length === 0 ? (
                  <ComingSoonEmptyState
                    title={msg.contentTypeSoon}
                    subtitle="এই অধ্যায়ের অনুধাবন প্রশ্ন শীঘ্রই যোগ করা হবে"
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {freeDetailCqs.length > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Eye className="size-3" /> ফ্রি {toBengaliNum(freeDetailCqs.length)}টি
                        </Badge>
                      )}
                      {purchasedDetailCqs.length > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <CheckCircle2 className="size-3" /> কেনা {toBengaliNum(purchasedDetailCqs.length)}টি
                        </Badge>
                      )}
                      {lockedDetailCqs.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Lock className="size-3" /> প্রিমিয়াম {toBengaliNum(lockedDetailCqs.length)}টি
                        </Badge>
                      )}
                    </div>

                    {/* Free CQs */}
                    {freeDetailCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-indigo-500" />
                          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">ফ্রি অনুধাবন প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {freeDetailCqs.map((cq) => renderDetailCqCard(
                            cq, false, 'bg-indigo-500', 'bg-indigo-50 dark:bg-indigo-950/30', 'text-indigo-600 dark:text-indigo-400',
                            <BookOpenCheck className="size-4 text-indigo-600 dark:text-indigo-400" />,
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Eye className="size-3" /> ফ্রি</Badge>,
                            renderUnderstandingQuestions,
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Purchased CQs */}
                    {purchasedDetailCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা অনুধাবন প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {purchasedDetailCqs.map((cq) => renderDetailCqCard(
                            cq, false, 'bg-emerald-500', 'bg-emerald-50 dark:bg-emerald-950/30', 'text-emerald-600 dark:text-emerald-400',
                            <BookOpenCheck className="size-4 text-emerald-600 dark:text-emerald-400" />,
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><CheckCircle2 className="size-3" /> কেনা</Badge>,
                            renderUnderstandingQuestions,
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locked CQs */}
                    {lockedDetailCqs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম অনুধাবন প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {lockedDetailCqs.map((cq) => renderDetailCqCard(
                            cq, true, 'bg-amber-500', 'bg-amber-50 dark:bg-amber-950/30', 'text-amber-600 dark:text-amber-400',
                            <BookOpenCheck className="size-4 text-amber-600 dark:text-amber-400" />,
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>,
                            renderUnderstandingQuestions,
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ═══════ "সৃজনশীল প্রশ্ন" Tab — inline CQ list ═══════ */}
            <TabsContent value="exam">
              <div className="mt-4">
                {/* Fetch trigger */}
                {!cqsFetched && !cqsLoading && (
                  <EffectWrapper callback={() => fetchCqs(chapterData.id)} />
                )}

                {cqsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-amber-600" />
                  </div>
                ) : cqs.length === 0 ? (
                  <ComingSoonEmptyState
                    title={msg.contentTypeSoon}
                    subtitle="এই অধ্যায়ের সৃজনশীল প্রশ্ন শীঘ্রই যোগ করা হবে"
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {freeCqs.length > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Eye className="size-3" /> ফ্রি {toBengaliNum(freeCqs.length)}টি
                        </Badge>
                      )}
                      {purchasedCqs.length > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <CheckCircle2 className="size-3" /> কেনা {toBengaliNum(purchasedCqs.length)}টি
                        </Badge>
                      )}
                      {lockedCqs.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <Lock className="size-3" /> প্রিমিয়াম {toBengaliNum(lockedCqs.length)}টি
                        </Badge>
                      )}
                    </div>

                    {/* Free CQs */}
                    {freeCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">ফ্রি সৃজনশীল প্রশ্ন</span>
                        </div>
                        <div className="space-y-2">
                          {freeCqs.map((cq) => (
                            <Card
                              key={cq.id}
                              className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-border/50"
                              onClick={() => navigate('cq-viewer', { cqId: cq.id, classSlug: chapterData.classSlug, subjectId: chapterData.subjectId })}
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                              <CardContent className="p-3 pl-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 shrink-0">
                                    <ClipboardList className="size-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm line-clamp-2"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + '...' : cq.uddeepok} inline /></div>
                                    {cq.uddeepokImage && (
                                      <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-1 max-w-full rounded-lg border max-h-24" />
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                      <span>{toBengaliNum(cq.questionCount)}টি প্রশ্ন</span>
                                      {cq.board && (
                                        <>
                                          <span className="text-muted-foreground/50">·</span>
                                          <span>{cq.board} বোর্ড</span>
                                        </>
                                      )}
                                      {cq.year && (
                                        <>
                                          <span className="text-muted-foreground/50">·</span>
                                          <span>{cq.year}</span>
                                        </>
                                      )}
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

                    {/* Purchased CQs */}
                    {purchasedCqs.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা সৃজনশীল প্রশ্ন</span>
                        </div>
                        <div className="space-y-2">
                          {purchasedCqs.map((cq) => (
                            <Card
                              key={cq.id}
                              className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-emerald-200 dark:border-emerald-800"
                              onClick={() => navigate('cq-viewer', { cqId: cq.id, classSlug: chapterData.classSlug, subjectId: chapterData.subjectId })}
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                              <CardContent className="p-3 pl-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                                    <ClipboardList className="size-4 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm line-clamp-2"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + '...' : cq.uddeepok} inline /></div>
                                    {cq.uddeepokImage && (
                                      <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-1 max-w-full rounded-lg border max-h-24" />
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                      <span>{toBengaliNum(cq.questionCount)}টি প্রশ্ন</span>
                                      {cq.board && <><span className="text-muted-foreground/50">·</span><span>{cq.board} বোর্ড</span></>}
                                      {cq.year && <><span className="text-muted-foreground/50">·</span><span>{cq.year}</span></>}
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

                    {/* Locked CQs */}
                    {lockedCqs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম সৃজনশীল প্রশ্ন</span>
                        </div>
                        <div className="space-y-2">
                          {lockedCqs.map((cq) => (
                            <Card
                              key={cq.id}
                              className="cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10"
                              onClick={() => openPurchaseModal('cq', cq.id, cq.uddeepok.length > 60 ? cq.uddeepok.slice(0, 60) + '...' : cq.uddeepok, cq.price, chapterData.classSlug)}
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                              <CardContent className="p-3 pl-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 shrink-0">
                                    <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm line-clamp-2"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + '...' : cq.uddeepok} inline /></div>
                                    {cq.uddeepokImage && (
                                      <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-1 max-w-full rounded-lg border max-h-24" />
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                      <span>{toBengaliNum(cq.questionCount)}টি প্রশ্ন</span>
                                      {cq.board && <><span className="text-muted-foreground/50">·</span><span>{cq.board} বোর্ড</span></>}
                                      {cq.year && <><span className="text-muted-foreground/50">·</span><span>{cq.year}</span></>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"><Lock className="size-3" /> প্রিমিয়াম</Badge>
                                    {cq.price > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{cq.price}</Badge>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ═══════ "সাজেশন" Tab — inline suggestions ═══════ */}
            <TabsContent value="suggestion">
              {suggestions.length === 0 && !suggestionsLoading ? (
                <ComingSoonEmptyState title={msg.contentTypeSoon} subtitle="এই অধ্যায়ের সাজেশন শীঘ্রই যোগ করা হবে" />
              ) : suggestionsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 mt-4">
                  {[...freeSuggestions, ...purchasedSuggestions, ...pendingSuggestions, ...lockedSuggestions].map((s) => {
                    const isPurchased = suggestionPurchaseMap[s.id]?.purchased
                    const isPending = suggestionPurchaseMap[s.id]?.pendingPayment && !isPurchased
                    const isLocked = s.isPremium && !isPurchased && !isPending
                    return (
                      <Card key={s.id} className={cn("group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer", isPending && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10")} onClick={() => {
                        if (isPending) { navigate('suggestion-view', { suggestionId: s.id }); return }
                        if (!isLocked) navigate('suggestion-view', { suggestionId: s.id })
                        else { setPurchaseModalOpen(true); setPurchaseModalData({ contentType: 'suggestion', contentId: s.id, contentTitle: s.title, contentPrice: s.price || 0, classLevel: s.className || '' }) }
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-xl shrink-0">
                              <Lightbulb className="size-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{s.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {s.viewCount !== undefined && s.viewCount > 0 && <span className="text-xs text-muted-foreground">{s.viewCount} ভিউ</span>}
                              </div>
                            </div>
                            {isPending ? (<Clock className="size-4 text-yellow-500 shrink-0" />) : isLocked ? (<Lock className="size-4 text-muted-foreground shrink-0" />) : (<ChevronRight className="size-4 text-muted-foreground shrink-0" />)}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </motion.div>
              )}
            </TabsContent>

            {/* ═══════ "এক্সাম" Tab — inline exams ═══════ */}
            <TabsContent value="exam">
              {exams.length === 0 && !examsLoading ? (
                <ComingSoonEmptyState title={msg.contentTypeSoon} subtitle="এই অধ্যায়ের এক্সাম শীঘ্রই যোগ করা হবে" />
              ) : examsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 mt-4">
                  {[...freeExams, ...purchasedExams, ...lockedExams].map((e) => {
                    const isPurchased = examPurchaseMap[e.id]?.purchased
                    const isLocked = e.isPremium && !isPurchased
                    return (
                      <Card key={e.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer" onClick={() => { if (!isLocked) navigate('mcq-exam', { examId: e.id }); else setPurchaseModalOpen(true); setPurchaseModalData({ contentType: 'exam', contentId: e.id, contentTitle: e.title, contentPrice: e.price, classLevel: e.classLevel }); } }>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl shrink-0">
                              <GraduationCap className="size-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{e.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{e.type === 'mcq' ? 'MCQ' : e.type === 'cq' ? 'CQ' : 'Mixed'}</Badge>
                                <span className="text-xs text-muted-foreground">{e.duration} মিনিট</span>
                                <span className="text-xs text-muted-foreground">{e.totalMarks} নম্বর</span>
                              </div>
                            </div>
                            {isLocked ? (<Lock className="size-4 text-muted-foreground shrink-0" />) : (<ChevronRight className="size-4 text-muted-foreground shrink-0" />)}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </motion.div>
              )}
            </TabsContent>

            {/* ═══════ "সংক্ষিপ্ত প্রশ্ন" Tab — inline short Q&A ═══════ */}
            <TabsContent value="short-questions">
              <div className="mt-4">
                {/* Fetch trigger */}
                {!shortQuestionsFetched && !shortQuestionsLoading && (
                  <EffectWrapper callback={() => fetchShortQuestions(chapterData.id)} />
                )}

                {shortQuestionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-cyan-600" />
                  </div>
                ) : freeShortQuestions.length === 0 && purchasedShortQuestions.length === 0 && lockedShortQuestions.length === 0 ? (
                  <ComingSoonEmptyState
                    title={msg.contentTypeSoon}
                    subtitle="এই অধ্যায়ের সংক্ষিপ্ত প্রশ্ন শীঘ্রই যোগ করা হবে"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-2">
                      {freeShortQuestions.length > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                          <Eye className="size-3" /> ফ্রি {toBengaliNum(freeShortQuestions.length)}টি
                        </Badge>
                      )}
                      {purchasedShortQuestions.length > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                          <CheckCircle2 className="size-3" /> কেনা {toBengaliNum(purchasedShortQuestions.length)}টি
                        </Badge>
                      )}
                      {lockedShortQuestions.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                          <Lock className="size-3" /> প্রিমিয়াম {toBengaliNum(lockedShortQuestions.length)}টি
                        </Badge>
                      )}
                    </div>

                    {/* Free questions */}
                    {freeShortQuestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-cyan-500" />
                          <span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">ফ্রি প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {freeShortQuestions.map((q, i) => (
                            <Card key={q.id} className="overflow-hidden border-l-4 border-l-emerald-400">
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      <span className="text-muted-foreground mr-2">{toBengaliNum(i + 1)}.</span>
                                      <RichContentRenderer content={q.question} inline />
                                      <span className="mx-1.5 text-muted-foreground">—</span>
                                      <RichContentRenderer content={q.answer} inline />
                                    </p>
                                    {q.questionImage && (
                                      <img src={q.questionImage} alt="প্রশ্নের ছবি" className="mt-2 max-w-full h-auto rounded-lg" />
                                    )}
                                    {q.answerImage && (
                                      <img src={q.answerImage} alt="উত্তরের ছবি" className="mt-2 max-w-full h-auto rounded-lg" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Purchased questions */}
                    {purchasedShortQuestions.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">কেনা প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {purchasedShortQuestions.map((q, i) => {
                            const freeCount = freeShortQuestions.length
                            return (
                              <Card key={q.id} className="overflow-hidden border-l-4 border-l-emerald-500">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        <span className="text-muted-foreground mr-2">{toBengaliNum(freeCount + i + 1)}.</span>
                                        <RichContentRenderer content={q.question} inline />
                                        <span className="mx-1.5 text-muted-foreground">—</span>
                                        <RichContentRenderer content={q.answer} inline />
                                      </p>
                                      {q.questionImage && (
                                        <img src={q.questionImage} alt="প্রশ্নের ছবি" className="mt-2 max-w-full h-auto rounded-lg" />
                                      )}
                                      {q.answerImage && (
                                        <img src={q.answerImage} alt="উত্তরের ছবি" className="mt-2 max-w-full h-auto rounded-lg" />
                                      )}
                                    </div>
                                    <Badge className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      <CheckCircle2 className="size-3 mr-1" /> কেনা
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Locked premium questions */}
                    {lockedShortQuestions.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">প্রিমিয়াম প্রশ্ন</span>
                        </div>
                        <div className="space-y-3">
                          {lockedShortQuestions.map((q, i) => {
                            const visibleCount = freeShortQuestions.length + purchasedShortQuestions.length
                            return (
                              <Card
                                key={q.id}
                                className="overflow-hidden border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => {
                                  setPurchaseModalOpen(true)
                                  setPurchaseModalData({
                                    contentType: 'short-questions',
                                    contentId: q.id,
                                    contentTitle: q.question.length > 60 ? q.question.slice(0, 60) + '...' : q.question,
                                    contentPrice: q.price,
                                    classLevel: chapterData.classSlug,
                                  })
                                }}
                              >
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium text-muted-foreground">
                                        <span className="text-muted-foreground mr-2">{toBengaliNum(visibleCount + i + 1)}.</span>
                                        <RichContentRenderer content={q.question} inline />
                                        <span className="mx-1.5 text-muted-foreground">—</span>
                                        <span className="blur-sm select-none italic">উত্তর দেখতে কিনুন</span>
                                      </p>
                                      {q.questionImage && (
                                        <img src={q.questionImage} alt="প্রশ্নের ছবি" className="mt-2 max-w-full h-auto rounded-lg opacity-60" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
                                        <Lock className="size-3" /> প্রিমিয়াম
                                      </Badge>
                                      {q.price > 0 && (
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">৳{q.price}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>

      {/* Purchase Modal */}
      {purchaseModalData && (
        <PurchaseOptionsModal
          open={purchaseModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setPurchaseModalOpen(false)
              setPurchaseModalData(null)
            }
          }}
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
