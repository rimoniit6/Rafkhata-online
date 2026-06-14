'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  FileQuestion,
  ClipboardList,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  ChevronRight,
  Search,
  BookOpen,
  Play,
  Crown,
  School,
  Zap,
  Filter,
  Sparkles,
  BarChart3,
  Users,
  Clock,
} from 'lucide-react'
import SafeImage from '@/components/ui/safe-image'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const PurchaseOptionsModal = dynamic(() => import('@/components/shared/PurchaseOptionsModal'))

// ─── Types ──────────────────────────────────────────────────────

interface BoardQuestionItem {
  id: string
  type: 'mcq' | 'cq'
  board: string
  year: string
  classLevel: string
  subjectId: string
  subjectName: string
  chapterName: string
  title: string
  question: string
  questionImage?: string | null
  isPremium: boolean
  price: number
  difficulty: string
  questionCount: number
  boardColor: string
}

interface YearInfo {
  year: string
  mcqCount: number
  cqCount: number
  boards: string[]
}

interface BoardInfo {
  slug: string
  name: string
  mcqCount: number
  cqCount: number
  color: string
}

interface ClassInfo {
  id: string
  name: string
  slug: string
  order: number
  mcqCount: number
  cqCount: number
  boardCount: number
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
  reason?: string | null
}

// ─── Step enum ──────────────────────────────────────────────────

type Step = 'select-class' | 'select-year' | 'select-board' | 'view-questions'

// ─── Animation variants ─────────────────────────────────────────

const pageVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const

// ─── Board Color Utility ────────────────────────────────────────

interface BoardColorClasses {
  bg: string
  text: string
  gradient: string
  border: string
  lightBg: string
}

function getBoardColorClasses(color: string): BoardColorClasses {
  const map: Record<string, BoardColorClasses> = {
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-400 to-rose-600',
      border: 'border-rose-200 dark:border-rose-800',
      lightBg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-400 to-emerald-600',
      border: 'border-emerald-200 dark:border-emerald-800',
      lightBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      text: 'text-sky-600 dark:text-sky-400',
      gradient: 'from-sky-400 to-sky-600',
      border: 'border-sky-200 dark:border-sky-800',
      lightBg: 'bg-sky-100 dark:bg-sky-900/30',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-400 to-amber-600',
      border: 'border-amber-200 dark:border-amber-800',
      lightBg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      text: 'text-violet-600 dark:text-violet-400',
      gradient: 'from-violet-400 to-violet-600',
      border: 'border-violet-200 dark:border-violet-800',
      lightBg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-400 to-orange-600',
      border: 'border-orange-200 dark:border-orange-800',
      lightBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      text: 'text-teal-600 dark:text-teal-400',
      gradient: 'from-teal-400 to-teal-600',
      border: 'border-teal-200 dark:border-teal-800',
      lightBg: 'bg-teal-100 dark:bg-teal-900/30',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      text: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-400 to-pink-600',
      border: 'border-pink-200 dark:border-pink-800',
      lightBg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      gradient: 'from-indigo-400 to-indigo-600',
      border: 'border-indigo-200 dark:border-indigo-800',
      lightBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-400 to-cyan-600',
      border: 'border-cyan-200 dark:border-cyan-800',
      lightBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  }
  return map[color] || map.rose
}

// ─── Difficulty color mapping ───────────────────────────────────

const getDifficultyStripe = (d: string) => {
  switch (d) {
    case 'easy': return 'bg-emerald-500'
    case 'hard': return 'bg-red-500'
    default: return 'bg-amber-500'
  }
}

const getDifficultyColor = (d: string) => {
  switch (d) {
    case 'easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
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

// ─── Mini Bar Chart Component ───────────────────────────────────

function MiniBarChart({ mcq, cq, maxTotal }: { mcq: number; cq: number; maxTotal: number }) {
  const mcqPct = maxTotal > 0 ? (mcq / maxTotal) * 100 : 0
  const cqPct = maxTotal > 0 ? (cq / maxTotal) * 100 : 0

  return (
    <div className="flex items-end gap-1 h-8">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-6 bg-teal-400 dark:bg-teal-500 rounded-t-sm transition-all" style={{ height: `${Math.max(mcqPct, 4)}%`, minHeight: 4 }} />
        <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium">M</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-6 bg-amber-400 dark:bg-amber-500 rounded-t-sm transition-all" style={{ height: `${Math.max(cqPct, 4)}%`, minHeight: 4 }} />
        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">C</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────

export default function BoardQuestionsPage() {
  const { params, navigate, goBack, updateParams } = useRouterStore()
  const { user } = useAuthStore()
  const metadata = useHierarchyMetadata()
  const boardLabelMap = metadata.boardSlugToLabel
  const classLabelMap = metadata.classLevelLabels

  const boardLabelMapRef = useRef(boardLabelMap)
  boardLabelMapRef.current = boardLabelMap
  const classLabelMapRef = useRef(classLabelMap)
  classLabelMapRef.current = classLabelMap

  // Step state
  const [step, setStep] = useState<Step>('select-class')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedBoard, setSelectedBoard] = useState<string>('')

  // Data states
  const [classData, setClassData] = useState<ClassInfo[]>([])
  const [yearData, setYearData] = useState<YearInfo[]>([])
  const [boardData, setBoardData] = useState<BoardInfo[]>([])
  const [mcqQuestions, setMcqQuestions] = useState<BoardQuestionItem[]>([])
  const [cqQuestions, setCqQuestions] = useState<BoardQuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('mcq')

  // Subject filter for step 4
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // Purchase
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  // Expanded MCQ inline preview
  const [expandedMcqId, setExpandedMcqId] = useState<string | null>(null)
  const [expandedMcqData, setExpandedMcqData] = useState<{
    text: string
    questionImage?: string | null
    options: { key: string; text: string; image?: string | null }[]
    correctAnswer: string
    explanation: string
    explanationImage?: string | null
  } | null>(null)
  const [expandedMcqLoading, setExpandedMcqLoading] = useState(false)

  // Initialize from router params
  useEffect(() => {
    const classLevel = params.classLevel || params.classSlug || ''
    if (classLevel && params.year && params.boardName) {
      setSelectedClass(classLevel)
      setSelectedYear(params.year)
      setSelectedBoard(params.boardName)
      setStep('view-questions')
    } else if (classLevel && params.year) {
      setSelectedClass(classLevel)
      setSelectedYear(params.year)
      setStep('select-board')
    } else if (classLevel) {
      setSelectedClass(classLevel)
      setStep('select-year')
    }
  }, [params.classLevel, params.classSlug, params.year, params.boardName])

  // ─── Fetch class-level data ───────────────────────────────

  const fetchClassData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/board-questions/filters')
      if (res.ok) {
        const data = await res.json()
        const classLevels: ClassInfo[] = data.data?.classLevels || []
        
        // Fetch actual counts for each class level
        const classWithCounts = await Promise.all(
          classLevels.map(async (cls) => {
            try {
              const [mcqRes, cqRes] = await Promise.all([
                fetch(`/api/board-questions?type=mcq&classLevel=${encodeURIComponent(cls.slug)}&limit=100`),
                fetch(`/api/board-questions?type=cq&classLevel=${encodeURIComponent(cls.slug)}&limit=100`),
              ])
              const mcqJson = mcqRes.ok ? await mcqRes.json() : null
              const cqJson = cqRes.ok ? await cqRes.json() : null
              
              const mcqItems = Array.isArray(mcqJson?.data) ? mcqJson.data : []
              const cqItems = Array.isArray(cqJson?.data) ? cqJson.data : []
              
              // Count unique boards
              const allBoards = new Set([
                ...mcqItems.map((q: BoardQuestionItem) => q.board),
                ...cqItems.map((q: BoardQuestionItem) => q.board),
              ])
              
              return {
                ...cls,
                mcqCount: mcqItems.length,
                cqCount: cqItems.length,
                boardCount: allBoards.size,
              }
            } catch {
              return { ...cls, mcqCount: 0, cqCount: 0, boardCount: 0 }
            }
          })
        )
        
        // Only include classes that have content
        const filteredClasses = classWithCounts.filter(c => c.mcqCount > 0 || c.cqCount > 0)
        setClassData(filteredClasses.sort((a, b) => a.order - b.order))
      }
    } catch {
      setClassData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Fetch year-level data ────────────────────────────────

  const fetchYearData = useCallback(async (classLevel: string) => {
    setLoading(true)
    try {
      const filterRes = await fetch(`/api/board-questions/filters?classLevel=${encodeURIComponent(classLevel)}`)
      if (filterRes.ok) {
        const filterData = await filterRes.json()
        const years: string[] = filterData.data?.years || []
        
        // Fetch actual counts for each year - only include years with content
        const countPromises = years.map(async (year) => {
          try {
            const [mcqRes, cqRes] = await Promise.all([
              fetch(`/api/board-questions?type=mcq&year=${year}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
              fetch(`/api/board-questions?type=cq&year=${year}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
            ])
            const mcqJson = mcqRes.ok ? await mcqRes.json() : null
            const cqJson = cqRes.ok ? await cqRes.json() : null
            
            // Count actual items from data array (reliable method)
            const mcqItems = Array.isArray(mcqJson?.data) ? mcqJson.data : []
            const cqItems = Array.isArray(cqJson?.data) ? cqJson.data : []
            const mcqCount = mcqItems.length
            const cqCount = cqItems.length
            
            // Only include years that have content
            if (mcqCount === 0 && cqCount === 0) {
              return null
            }
            
            return {
              year,
              mcqCount,
              cqCount,
              boards: Array.from(new Set([
                ...mcqItems.map((q: BoardQuestionItem) => q.board),
                ...cqItems.map((q: BoardQuestionItem) => q.board),
              ])),
            }
          } catch {
            return { year, mcqCount: 0, cqCount: 0, boards: [] }
          }
        })
        const results = (await Promise.all(countPromises)).filter(Boolean) as YearInfo[]
        setYearData(results.sort((a, b) => b.year.localeCompare(a.year)))
      }
    } catch {
      setYearData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Fetch board-level data ───────────────────────────────

  const fetchBoardData = useCallback(async (classLevel: string, year: string) => {
    setLoading(true)
    try {
      // Fetch all questions to get accurate counts per board
      const [mcqRes, cqRes] = await Promise.all([
        fetch(`/api/board-questions?type=mcq&year=${year}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
        fetch(`/api/board-questions?type=cq&year=${year}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
      ])
      
      const mcqJson = mcqRes.ok ? await mcqRes.json() : null
      const cqJson = cqRes.ok ? await cqRes.json() : null
      
      const mcqItems: BoardQuestionItem[] = Array.isArray(mcqJson?.data) ? mcqJson.data : []
      const cqItems: BoardQuestionItem[] = Array.isArray(cqJson?.data) ? cqJson.data : []
      
      const boardMap = new Map<string, BoardInfo>()
      
      // Count MCQs per board
      for (const item of mcqItems) {
        if (!boardMap.has(item.board)) {
          boardMap.set(item.board, {
            slug: item.board,
            name: boardLabelMapRef.current[item.board] || item.board,
            mcqCount: 0,
            cqCount: 0,
            color: item.boardColor || 'rose',
          })
        }
        const info = boardMap.get(item.board)!
        info.mcqCount++
      }
      
      // Count CQs per board
      for (const item of cqItems) {
        if (!boardMap.has(item.board)) {
          boardMap.set(item.board, {
            slug: item.board,
            name: boardLabelMapRef.current[item.board] || item.board,
            mcqCount: 0,
            cqCount: 0,
            color: item.boardColor || 'rose',
          })
        }
        const info = boardMap.get(item.board)!
        info.cqCount++
      }

      // Only include boards that have content
      const filteredBoards = Array.from(boardMap.values()).filter(b => b.mcqCount > 0 || b.cqCount > 0)
      setBoardData(filteredBoards.sort((a, b) => a.name.localeCompare(b.name)))
    } catch {
      setBoardData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Fetch questions ──────────────────────────────────────

  const fetchQuestions = useCallback(async (classLevel: string, year: string, board: string) => {
    setLoading(true)
    try {
      const [mcqRes, cqRes] = await Promise.all([
        fetch(`/api/board-questions?type=mcq&year=${year}&board=${board}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
        fetch(`/api/board-questions?type=cq&year=${year}&board=${board}&classLevel=${encodeURIComponent(classLevel)}&limit=100`),
      ])

      const mcqJson = mcqRes.ok ? await mcqRes.json() : { data: [] }
      const cqJson = cqRes.ok ? await cqRes.json() : { data: [] }

      const rawMcq: BoardQuestionItem[] = Array.isArray(mcqJson.data) ? mcqJson.data : []
      const rawCq: BoardQuestionItem[] = Array.isArray(cqJson.data) ? cqJson.data : []

      const sortByPremium = (a: BoardQuestionItem, b: BoardQuestionItem) => {
        if (a.isPremium === b.isPremium) return 0
        return a.isPremium ? 1 : -1
      }

      setMcqQuestions(rawMcq.sort(sortByPremium))
      setCqQuestions(rawCq.sort(sortByPremium))
      setActiveTab(rawMcq.length > 0 ? 'mcq' : 'cq')
      setSelectedSubject('all')
    } catch {
      setMcqQuestions([])
      setCqQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Load data based on step ─────────────────────────────

  useEffect(() => {
    if (step === 'select-class') fetchClassData()
    else if (step === 'select-year' && selectedClass) fetchYearData(selectedClass)
    else if (step === 'select-board' && selectedClass && selectedYear) fetchBoardData(selectedClass, selectedYear)
    else if (step === 'view-questions' && selectedClass && selectedYear && selectedBoard) fetchQuestions(selectedClass, selectedYear, selectedBoard)
  }, [step, selectedClass, selectedYear, selectedBoard, fetchClassData, fetchYearData, fetchBoardData, fetchQuestions])

  // ─── Check purchase status (batch check for efficiency) ──

  useEffect(() => {
    const allQuestions = [...mcqQuestions, ...cqQuestions].filter(q => q.isPremium)
    if (allQuestions.length === 0) return

    const checkPurchases = async () => {
      try {
        // Use batch-check endpoint instead of N individual calls
        const items = allQuestions.map(q => ({
          contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
          contentId: q.id,
        }))
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const responseItems = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const item of responseItems) {
            newMap[item.contentId] = {
              purchased: item.purchased || false,
              pendingPayment: item.pendingPayment || false,
              reason: item.reason || null,
            }
          }
          // Mark any items not in response as not purchased
          for (const q of allQuestions) {
            if (!newMap[q.id]) {
              newMap[q.id] = { purchased: false, pendingPayment: false }
            }
          }
          setPurchaseMap(prev => ({ ...prev, ...newMap }))
        }
      } catch {
        // On failure, mark all as not purchased
        const newMap: Record<string, PurchaseStatus> = {}
        for (const q of allQuestions) {
          newMap[q.id] = { purchased: false, pendingPayment: false }
        }
        setPurchaseMap(prev => ({ ...prev, ...newMap }))
      }
    }
    checkPurchases()
  }, [mcqQuestions, cqQuestions])

  // ─── Sorted questions with purchase info ──────────────────

  const sortedMcqQuestions = useMemo(() => {
    return [...mcqQuestions].sort((a, b) => {
      const aLocked = a.isPremium && !purchaseMap[a.id]?.purchased
      const bLocked = b.isPremium && !purchaseMap[b.id]?.purchased
      if (aLocked === bLocked) return 0
      return aLocked ? 1 : -1
    })
  }, [mcqQuestions, purchaseMap])

  const sortedCqQuestions = useMemo(() => {
    return [...cqQuestions].sort((a, b) => {
      const aLocked = a.isPremium && !purchaseMap[a.id]?.purchased
      const bLocked = b.isPremium && !purchaseMap[b.id]?.purchased
      if (aLocked === bLocked) return 0
      return aLocked ? 1 : -1
    })
  }, [cqQuestions, purchaseMap])

  // ─── Subject grouping for Step 4 ─────────────────────────

  // Always use the full lists for tab counts, not filtered by subject
  const mcqTabCount = sortedMcqQuestions.length
  const cqTabCount = sortedCqQuestions.length
  
  const currentQuestions = activeTab === 'mcq' ? sortedMcqQuestions : sortedCqQuestions

  const subjects = useMemo(() => {
    const subMap = new Map<string, { id: string; name: string }>()
    for (const q of currentQuestions) {
      if (!subMap.has(q.subjectId)) {
        subMap.set(q.subjectId, { id: q.subjectId, name: q.subjectName })
      }
    }
    return Array.from(subMap.values())
  }, [currentQuestions])

  const groupedQuestions = useMemo(() => {
    const filtered = selectedSubject === 'all'
      ? currentQuestions
      : currentQuestions.filter(q => q.subjectId === selectedSubject)

    const groupMap = new Map<string, { subject: { id: string; name: string }; chapters: Map<string, { name: string; questions: BoardQuestionItem[] }> }>()

    for (const q of filtered) {
      if (!groupMap.has(q.subjectId)) {
        groupMap.set(q.subjectId, { subject: { id: q.subjectId, name: q.subjectName }, chapters: new Map() })
      }
      const subjectGroup = groupMap.get(q.subjectId)!
      const chapterKey = q.chapterName || 'uncategorized'
      if (!subjectGroup.chapters.has(chapterKey)) {
        subjectGroup.chapters.set(chapterKey, { name: q.chapterName || 'অন্যান্য', questions: [] })
      }
      subjectGroup.chapters.get(chapterKey)!.questions.push(q)
    }

    return Array.from(groupMap.values())
  }, [currentQuestions, selectedSubject])

  // ─── Handlers ─────────────────────────────────────────────

  const handleClassSelect = (classSlug: string) => {
    setSelectedClass(classSlug)
    setStep('select-year')
    updateParams({ classLevel: classSlug, year: undefined, boardName: undefined })
  }

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setStep('select-board')
    updateParams({ year, boardName: undefined })
  }

  const handleBoardSelect = (board: string) => {
    setSelectedBoard(board)
    setStep('view-questions')
    updateParams({ boardName: board })
  }

  const handleBack = () => {
    if (step === 'view-questions') {
      setSelectedBoard('')
      setStep('select-board')
    } else if (step === 'select-board') {
      setSelectedYear('')
      setStep('select-year')
    } else if (step === 'select-year') {
      setSelectedClass('')
      setStep('select-class')
    } else {
      navigate('home')
    }
  }

  const handleCardClick = (q: BoardQuestionItem) => {
    const purchase = purchaseMap[q.id]
    const isLocked = q.isPremium && !purchase?.purchased
    if (isLocked) {
      setPurchaseModalData({
        contentType: q.type === 'mcq' ? 'board-mcq' : 'board-cq',
        contentId: q.id,
        contentTitle: `${boardLabelMap[selectedBoard] || selectedBoard} বোর্ড - ${selectedYear} (${q.type.toUpperCase()})`,
        contentPrice: q.price,
        classLevel: q.classLevel,
      })
      setPurchaseModalOpen(true)
      return
    }
    if (q.type === 'mcq') {
      // Toggle inline expansion
      if (expandedMcqId === q.id) {
        setExpandedMcqId(null)
        setExpandedMcqData(null)
        return
      }
      setExpandedMcqId(q.id)
      setExpandedMcqData(null)
      setExpandedMcqLoading(true)
      fetch(`/api/mcq/${q.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setExpandedMcqData({
              text: data.text || '',
              questionImage: data.questionImage || null,
              options: (data.options || []).map((opt: { key: string; text: string; image?: string | null }) => ({
                key: opt.key,
                text: opt.text,
                image: opt.image || null,
              })),
              correctAnswer: data.correctAnswer || '',
              explanation: data.explanation || '',
              explanationImage: data.explanationImage || null,
            })
          }
          setExpandedMcqLoading(false)
        })
        .catch(() => setExpandedMcqLoading(false))
    } else {
      navigate('cq-viewer', {
        cqId: q.id,
        classSlug: q.classLevel,
        subjectId: q.subjectId,
        year: selectedYear,
        boardName: selectedBoard,
        classLevel: selectedClass,
        source: 'board',
      })
    }
  }

  const handleStartMcqPractice = () => {
    const filtered = selectedSubject === 'all'
      ? sortedMcqQuestions
      : sortedMcqQuestions.filter(q => q.subjectId === selectedSubject)
    navigate('mcq-exam', {
      classSlug: filtered[0]?.classLevel || selectedClass,
      subjectId: selectedSubject !== 'all' ? selectedSubject : '',
      year: selectedYear,
      boardName: selectedBoard,
      classLevel: selectedClass,
      source: 'board',
    })
  }

  const isQuestionLocked = (q: BoardQuestionItem) => q.isPremium && !purchaseMap[q.id]?.purchased
  const isQuestionPending = (q: BoardQuestionItem) => q.isPremium && purchaseMap[q.id]?.pendingPayment

  // ─── Helpers ──────────────────────────────────────────────

  const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])
  const selectedClassName = classLabelMap[selectedClass] || selectedClass

  // Get board color for current step
  const currentBoardColor = useMemo(() => {
    const board = boardData.find(b => b.slug === selectedBoard)
    return board?.color || 'rose'
  }, [boardData, selectedBoard])

  // ─── Render breadcrumb ────────────────────────────────────

  const renderBreadcrumb = () => (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3">
      <Breadcrumb>
        <BreadcrumbList className="text-xs sm:text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {step === 'select-class' && (
            <BreadcrumbItem><BreadcrumbPage>বোর্ড প্রশ্ন</BreadcrumbPage></BreadcrumbItem>
          )}
          {step === 'select-year' && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-class'); setSelectedClass('') }}>
                  বোর্ড প্রশ্ন
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selectedClassName}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
          {step === 'select-board' && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-class'); setSelectedClass(''); setSelectedYear('') }}>
                  বোর্ড প্রশ্ন
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-year'); setSelectedYear('') }}>
                  {selectedClassName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{selectedYear} সাল</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
          {step === 'view-questions' && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-class'); setSelectedClass(''); setSelectedYear(''); setSelectedBoard('') }}>
                  বোর্ড প্রশ্ন
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-year'); setSelectedYear(''); setSelectedBoard('') }}>
                  {selectedClassName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setStep('select-board'); setSelectedBoard('') }}>
                  {selectedYear} সাল
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{boardLabelMap[selectedBoard] || selectedBoard} বোর্ড</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )

  // ─── Render hero ──────────────────────────────────────────

  const renderHero = (title: string, subtitle: string, colorOverride?: string) => {
    const color = colorOverride || 'rose'
    const colorClasses = getBoardColorClasses(color)
    return (
      <div className={cn('relative h-32 sm:h-40 overflow-hidden bg-gradient-to-r', `from-${color}-500 via-${color}-600 to-${color}-700`)}
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-stops))`,
        }}
      >
        {/* Fallback solid gradient since dynamic Tailwind classes won't work */}
        <div className={cn('absolute inset-0 bg-gradient-to-r', color === 'emerald' ? 'from-emerald-500 via-emerald-600 to-emerald-700' : color === 'sky' ? 'from-sky-500 via-sky-600 to-sky-700' : color === 'amber' ? 'from-amber-500 via-amber-600 to-amber-700' : color === 'violet' ? 'from-violet-500 via-violet-600 to-violet-700' : color === 'orange' ? 'from-orange-500 via-orange-600 to-orange-700' : color === 'teal' ? 'from-teal-500 via-teal-600 to-teal-700' : color === 'pink' ? 'from-pink-500 via-pink-600 to-pink-700' : color === 'indigo' ? 'from-indigo-500 via-indigo-600 to-indigo-700' : color === 'cyan' ? 'from-cyan-500 via-cyan-600 to-cyan-700' : 'from-rose-500 via-rose-600 to-rose-700')} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-3 sm:px-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{title}</h1>
              <p className="text-white/75 text-xs sm:text-sm mt-0.5">{subtitle}</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ─── STEP 1: Class Selection — "শিক্ষা যাত্রা কার্ড" ─────

  const renderClassSelection = () => (
    <>
      {renderHero('বোর্ড প্রশ্ন হাব', 'আপনার ক্লাস নির্বাচন করুন')}
      {renderBreadcrumb()}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : classData.length === 0 ? (
          <div className="text-center py-16">
            <School className="size-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium">কোনো ক্লাস পাওয়া যায়নি</p>
            <p className="text-sm text-muted-foreground mt-1">শীঘ্রই নতুন ক্লাস যোগ করা হবে</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {classData.map((cls) => {
              const isSSC = cls.slug.toLowerCase().includes('ssc') || cls.slug.toLowerCase().includes('secondary')
              const gradientFrom = isSSC ? 'from-emerald-500' : 'from-rose-500'
              const gradientVia = isSSC ? 'via-emerald-600' : 'via-rose-600'
              const gradientTo = isSSC ? 'to-teal-600' : 'to-pink-600'
              const lightBg = isSSC ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'
              const accentText = isSSC ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              const accentBg = isSSC ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
              const totalCount = cls.mcqCount + cls.cqCount

              return (
                <motion.div key={cls.slug} variants={staggerItem} whileHover={{ y: -4, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group border-0"
                    onClick={() => handleClassSelect(cls.slug)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Left gradient panel */}
                      <div className={cn('relative w-full sm:w-48 p-6 flex flex-col justify-center items-center bg-gradient-to-br', gradientFrom, gradientVia, gradientTo)}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                        <div className="relative z-10 text-center">
                          <School className="size-10 text-white/90 mx-auto mb-2" />
                          <h2 className="text-2xl font-bold text-white">{cls.name}</h2>
                          <p className="text-white/70 text-xs mt-1">শিক্ষা যাত্রা</p>
                        </div>
                      </div>

                      {/* Right content panel */}
                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-foreground">{cls.name}</h3>
                          <ChevronRight className="size-5 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full', lightBg)}>
                            <FileQuestion className={cn('size-4', accentText)} />
                            <span className={cn('text-sm font-semibold', accentText)}>{toBengaliNum(cls.mcqCount)} MCQ</span>
                          </div>
                          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full', lightBg)}>
                            <ClipboardList className={cn('size-4', accentText)} />
                            <span className={cn('text-sm font-semibold', accentText)}>{toBengaliNum(cls.cqCount)} সৃজনশীল</span>
                          </div>
                          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full', accentBg)}>
                            <MapPin className={cn('size-4', accentText)} />
                            <span className={cn('text-sm font-semibold', accentText)}>{toBengaliNum(cls.boardCount)} বোর্ড</span>
                          </div>
                        </div>

                        {/* MCQ/CQ bar breakdown */}
                        {totalCount > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground shrink-0">MCQ</span>
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                                  style={{ width: `${totalCount > 0 ? (cls.mcqCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">{toBengaliNum(cls.mcqCount)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground shrink-0">সৃজনশীল</span>
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                  style={{ width: `${totalCount > 0 ? (cls.cqCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground w-8 text-right shrink-0">{toBengaliNum(cls.cqCount)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </>
  )

  // ─── STEP 2: Year Selection — "টাইমলাইন লেআউট" ─────────

  const renderYearSelection = () => {
    const maxTotal = Math.max(...yearData.map(y => y.mcqCount + y.cqCount), 1)

    return (
      <>
        {renderHero(selectedClassName, 'পরীক্ষার সাল নির্বাচন করুন')}
        {renderBreadcrumb()}

        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : yearData.length === 0 ? (
            <div className="text-center py-16">
              <Search className="size-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">{selectedClassName}-এ কোনো বোর্ড প্রশ্ন পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground mt-1">শীঘ্রই নতুন প্রশ্ন যোগ করা হবে</p>
              <Button variant="outline" className="mt-3" onClick={handleBack}>অন্য ক্লাস দেখুন</Button>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-300 via-rose-200 to-transparent dark:from-rose-700 dark:via-rose-800 hidden sm:block" />

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {yearData.map((yd, idx) => {
                  const isNew = idx === 0
                  const total = yd.mcqCount + yd.cqCount

                  return (
                    <motion.div key={yd.year} variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }}>
                      <div className="flex items-start gap-3 sm:gap-5">
                        {/* Timeline dot */}
                        <div className="hidden sm:flex flex-col items-center shrink-0 pt-5">
                          <div className={cn(
                            'size-4 rounded-full border-2 z-10',
                            isNew
                              ? 'bg-rose-500 border-rose-300 shadow-lg shadow-rose-500/30'
                              : 'bg-background border-rose-300 dark:border-rose-700'
                          )} />
                        </div>

                        {/* Year card */}
                        <Card
                          className="flex-1 cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden group"
                          onClick={() => handleYearSelect(yd.year)}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="size-5 text-rose-500" />
                                  <span className="text-2xl font-bold text-foreground">{yd.year}</span>
                                  {isNew && (
                                    <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] gap-0.5 px-1.5">
                                      <Sparkles className="size-3" /> নতুন!
                                    </Badge>
                                  )}
                                </div>

                                {/* Mini bar chart */}
                                <div className="flex items-end gap-4 mt-3">
                                  <MiniBarChart mcq={yd.mcqCount} cq={yd.cqCount} maxTotal={maxTotal} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded-sm bg-teal-400" />
                                        <span className="text-muted-foreground">MCQ</span>
                                        <span className="font-semibold text-teal-600 dark:text-teal-400">{toBengaliNum(yd.mcqCount)}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded-sm bg-amber-400" />
                                        <span className="text-muted-foreground">সৃজনশীল</span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{toBengaliNum(yd.cqCount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Board chips */}
                                {yd.boards.length > 0 && (
                                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                    <MapPin className="size-3 text-muted-foreground" />
                                    {yd.boards.slice(0, 4).map(b => (
                                      <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {boardLabelMap[b] || b}
                                      </span>
                                    ))}
                                    {yd.boards.length > 4 && (
                                      <span className="text-[10px] text-muted-foreground">+{toBengaliNum(yd.boards.length - 4)}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <ChevronRight className="size-5 text-muted-foreground/30 shrink-0 mt-2 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}
        </div>
      </>
    )
  }

  // ─── STEP 3: Board Selection — "বোর্ড কালেকশন কার্ড" ────

  const renderBoardSelection = () => (
    <>
      {renderHero(`${selectedClassName} · ${selectedYear} সাল`, 'বোর্ড নির্বাচন করুন')}
      {renderBreadcrumb()}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : boardData.length === 0 ? (
          <div className="text-center py-16">
            <Search className="size-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium">{selectedClassName} {selectedYear} সালে কোনো বোর্ড প্রশ্ন পাওয়া যায়নি</p>
            <Button variant="outline" className="mt-3" onClick={handleBack}>অন্য সাল দেখুন</Button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {boardData.map((bd) => {
              const total = bd.mcqCount + bd.cqCount
              const colorClasses = getBoardColorClasses(bd.color)
              const firstLetter = bd.name.charAt(0)

              return (
                <motion.div key={bd.slug} variants={staggerItem} whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={cn(
                      'cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group h-full',
                      colorClasses.border,
                    )}
                    onClick={() => handleBoardSelect(bd.slug)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Board avatar circle */}
                        <div className={cn(
                          'size-14 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br text-white font-bold text-xl shadow-lg',
                          colorClasses.gradient,
                        )}>
                          {firstLetter}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-foreground truncate">{bd.name}</h3>
                            <ChevronRight className="size-5 text-muted-foreground/30 shrink-0 group-hover:translate-x-1 transition-transform" />
                          </div>

                          {/* Total count badge */}
                          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3', colorClasses.lightBg)}>
                            <BarChart3 className={cn('size-3.5', colorClasses.text)} />
                            <span className={cn('text-sm font-semibold', colorClasses.text)}>
                              মোট {toBengaliNum(total)}টি প্রশ্ন
                            </span>
                          </div>

                          {/* MCQ/CQ breakdown bars */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <FileQuestion className="size-3.5 text-teal-500 shrink-0" />
                              <span className="text-xs text-muted-foreground shrink-0">MCQ</span>
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                                  style={{ width: `${total > 0 ? (bd.mcqCount / total) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 w-8 text-right shrink-0">{toBengaliNum(bd.mcqCount)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <ClipboardList className="size-3.5 text-amber-500 shrink-0" />
                              <span className="text-xs text-muted-foreground shrink-0">সৃজনশীল</span>
                              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                  style={{ width: `${total > 0 ? (bd.cqCount / total) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 w-8 text-right shrink-0">{toBengaliNum(bd.cqCount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </>
  )

  // ─── STEP 4: Questions View — "সাবজেক্ট-গ্রুপড কনটেন্ট হাব" ──

  const renderQuestionCard = (q: BoardQuestionItem) => {
    const locked = isQuestionLocked(q)
    const pending = isQuestionPending(q)
    const colorClasses = getBoardColorClasses(currentBoardColor)

    return (
      <Card
        key={q.id}
        className={cn(
          'group cursor-pointer hover:shadow-md transition-all relative overflow-hidden pb-2',
          locked ? 'border-amber-200/60 dark:border-amber-800/40' : 
          q.isPremium ? 'border-emerald-200/60 dark:border-emerald-800/40' :
          'border-border/50 hover:border-foreground/10',
        )}
        onClick={() => handleCardClick(q)}
      >
        {/* Progress bar at bottom - MCQ only (progress tracking not applicable for CQ) */}
        {q.type === 'mcq' && !locked && q.isPremium && purchaseMap[q.id]?.purchased && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '100%' }} />
          </div>
        )}
        
        <div className="flex">
          {/* Left: Difficulty stripe */}
          <div className={cn('w-1 shrink-0', getDifficultyStripe(q.difficulty))} />

          {/* Center: Content */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              {/* Type icon */}
              <div className={cn(
                'p-2.5 rounded-xl shrink-0',
                q.type === 'mcq' 
                  ? 'bg-teal-50 dark:bg-teal-950/30' 
                  : 'bg-amber-50 dark:bg-amber-950/30',
              )}>
                {q.type === 'mcq' ? (
                  <FileQuestion className="size-5 text-teal-600 dark:text-teal-400" />
                ) : (
                  <ClipboardList className="size-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title and badges in one line */}
                <div className="flex items-center gap-2 mb-1.5">
                  {expandedMcqId === q.id && expandedMcqData ? (
                    <RichContentRenderer content={expandedMcqData.text} className="font-medium text-sm leading-relaxed flex-1" />
                  ) : (
                    <RichContentRenderer content={q.question} className="font-medium text-sm leading-snug line-clamp-2 flex-1" />
                  )}
                  {/* Question count badge on right */}
                  {q.questionCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 ml-auto">
                      {q.type === 'cq' ? `${toBengaliNum(q.questionCount)}টি অংশ` : `${toBengaliNum(q.questionCount)}টি`}
                    </Badge>
                  )}
                </div>

                {expandedMcqId === q.id && expandedMcqData?.questionImage ? (
                  <SafeImage src={expandedMcqData.questionImage} alt="প্রশ্ন চিত্র" className="max-w-full rounded-lg border max-h-40 mb-2" />
                ) : q.questionImage ? (
                  <SafeImage src={q.questionImage} alt="প্রশ্ন চিত্র" className="max-w-full rounded-lg border max-h-40 mb-2" />
                ) : null}
                
                {/* Subject + Chapter info */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <BookOpen className="size-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">{q.subjectName}</span>
                  {q.chapterName && (
                    <>
                      <span className="text-xs text-muted-foreground/40">›</span>
                      <span className="text-xs text-muted-foreground/70 truncate">{q.chapterName}</span>
                    </>
                  )}
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {/* Difficulty badge */}
                  <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(q.difficulty))}>
                    {getDifficultyLabel(q.difficulty)}
                  </Badge>
                  
                  {/* Free/Premium badge */}
                  {!q.isPremium ? (
                    <Badge className="text-[10px] px-1.5 py-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 gap-0.5">
                      <Zap className="size-2.5" /> ফ্রি
                    </Badge>
                  ) : locked ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700 gap-0.5">
                      <Crown className="size-2.5" /> ৳{q.price}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-0.5">
                      <CheckCircle2 className="size-2.5" /> প্রিমিয়াম
                    </Badge>
                  )}
                  
                  {/* Purchase status badges (only for purchased premium content) */}
                  {!locked && q.isPremium && purchaseMap[q.id]?.reason === 'active_subscription' && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 gap-0.5">
                      <Crown className="size-2.5" /> সাবস্ক্রিপশন
                    </Badge>
                  )}
                  {!locked && q.isPremium && purchaseMap[q.id]?.reason === 'bundle_purchase' && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 gap-0.5">
                      <CheckCircle2 className="size-2.5" /> বান্ডেল
                    </Badge>
                  )}
                  {!locked && q.isPremium && purchaseMap[q.id]?.purchased && !purchaseMap[q.id]?.reason && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-0.5">
                      <CheckCircle2 className="size-2.5" /> কেনা
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right: Action button */}
              <div className="shrink-0 self-center">
                {locked && !pending && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
                    onClick={(e) => { e.stopPropagation(); handleCardClick(q) }}
                  >
                    <Lock className="size-3.5" /> কিনুন
                  </Button>
                )}
                {pending && (
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="size-4 text-amber-500 animate-pulse" />
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">অপেক্ষমাণ</span>
                  </div>
                )}
                {!locked && q.isPremium && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={(e) => { e.stopPropagation(); handleCardClick(q) }}
                  >
                    <Eye className="size-3.5" /> দেখুন
                  </Button>
                )}
                {!locked && !q.isPremium && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
                    onClick={(e) => { e.stopPropagation(); handleCardClick(q) }}
                  >
                    <Play className="size-3.5" /> শুরু
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderQuestions = () => {
    const boardName = boardLabelMap[selectedBoard] || selectedBoard
    const freeMcqCount = sortedMcqQuestions.filter(q => {
      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) return false
      return !isQuestionLocked(q)
    }).length
    const boardColorClasses = getBoardColorClasses(currentBoardColor)

    // Subject colors for headers
    const subjectColorPalette = [
      { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
      { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
      { bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
      { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
      { bg: 'bg-sky-50 dark:bg-sky-950/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
      { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    ]

    return (
      <>
        {renderHero(
          `${selectedClassName} · ${selectedYear} · ${boardName}`,
          'বিষয়ভিত্তিক প্রশ্ন ব্রাউজ করুন',
          currentBoardColor
        )}
        {renderBreadcrumb()}

        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-24">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : sortedMcqQuestions.length === 0 && sortedCqQuestions.length === 0 ? (
            <div className="text-center py-16">
              <Search className="size-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">কোনো প্রশ্ন পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedClassName} {selectedYear} সালের {boardName} বোর্ডে এখনো প্রশ্ন যোগ হয়নি
              </p>
              <Button variant="outline" className="mt-3" onClick={handleBack}>ফিরে যান</Button>
            </div>
          ) : (
            <>
              {/* MCQ/CQ pill tabs */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('mcq')}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeTab === 'mcq'
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                  disabled={sortedMcqQuestions.length === 0}
                >
                  <FileQuestion className="size-4" />
                  MCQ
                  {sortedMcqQuestions.length > 0 && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      activeTab === 'mcq' ? 'bg-white/25 text-white' : 'bg-background text-muted-foreground',
                    )}>
                      {toBengaliNum(mcqTabCount)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('cq')}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeTab === 'cq'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                  disabled={sortedCqQuestions.length === 0}
                >
                  <ClipboardList className="size-4" />
                  সৃজনশীল
                  {sortedCqQuestions.length > 0 && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      activeTab === 'cq' ? 'bg-white/25 text-white' : 'bg-background text-muted-foreground',
                    )}>
                      {toBengaliNum(cqTabCount)}
                    </span>
                  )}
                </button>
              </div>

              {/* Subject filter pills (sticky) */}
              {subjects.length > 1 && (
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-2 mb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-border/50">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <Filter className="size-3.5 text-muted-foreground shrink-0" />
                    <button
                      onClick={() => setSelectedSubject('all')}
                      className={cn(
                        'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selectedSubject === 'all'
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      সব
                    </button>
                    {subjects.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubject(sub.id)}
                        className={cn(
                          'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                          selectedSubject === sub.id
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grouped questions by subject → chapter */}
              {groupedQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTab === 'mcq' ? (
                    <><FileQuestion className="size-10 mx-auto mb-2 opacity-30" /><p className="text-sm">MCQ প্রশ্ন পাওয়া যায়নি</p></>
                  ) : (
                    <><ClipboardList className="size-10 mx-auto mb-2 opacity-30" /><p className="text-sm">সৃজনশীল প্রশ্ন পাওয়া যায়নি</p></>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedQuestions.map((subjectGroup, sIdx) => {
                    const colorTheme = subjectColorPalette[sIdx % subjectColorPalette.length]

                    return (
                      <motion.div
                        key={subjectGroup.subject.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sIdx * 0.05, duration: 0.3 }}
                      >
                        {/* Subject header */}
                        <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3', colorTheme.bg, colorTheme.border, 'border')}>
                          <BookOpen className={cn('size-4', colorTheme.text)} />
                          <h3 className={cn('font-semibold text-sm', colorTheme.text)}>{subjectGroup.subject.name}</h3>
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            {toBengaliNum(Array.from(subjectGroup.chapters.values()).reduce((sum, ch) => sum + ch.questions.length, 0))}টি প্রশ্ন
                          </Badge>
                        </div>

                        {/* Chapters */}
                        <div className="space-y-2 pl-1">
                          {Array.from(subjectGroup.chapters.entries()).map(([chapterKey, chapterData]) => (
                            <div key={chapterKey}>
                              {chapterKey !== 'uncategorized' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 mb-1">
                                  <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                                  <span className="text-xs font-medium text-muted-foreground">{chapterData.name}</span>
                                                                </div>
                              )}
                              <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                  {chapterData.questions.map((q, idx) => (
                                    <motion.div
                                      key={q.id}
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                                    >
                                      {renderQuestionCard(q)}
                                      {/* Expanded MCQ preview */}
                                      {expandedMcqId === q.id && q.type === 'mcq' && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="border border-t-0 border-emerald-200 dark:border-emerald-800 rounded-b-xl bg-emerald-50/50 dark:bg-emerald-950/10 overflow-hidden"
                                        >
                                          <div className="p-4 space-y-4">
                                            {expandedMcqLoading ? (
                                              <div className="space-y-3">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                                <Skeleton className="h-4 w-2/3" />
                                              </div>
                                            ) : expandedMcqData ? (
                                              <>
                                                {/* Options grid (matching MCQPracticePage style) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  {expandedMcqData.options.map((opt) => {
                                                    const isCorrect = opt.key === expandedMcqData.correctAnswer
                                                    return (
                                                      <div
                                                        key={opt.key}
                                                        className={cn(
                                                          'p-3 rounded-xl border-2 text-sm',
                                                          isCorrect
                                                            ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20'
                                                            : 'border-border/50 bg-card'
                                                        )}
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <span className={cn(
                                                            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                                                            isCorrect
                                                              ? 'bg-emerald-600 text-white'
                                                              : 'bg-muted text-muted-foreground'
                                                          )}>
                                                            {opt.key}
                                                          </span>
                                                          <RichContentRenderer content={opt.text} className="text-sm" inline />
                                                          {opt.image && (
                                                            <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="max-w-full rounded-lg border max-h-16" />
                                                          )}
                                                          {isCorrect && (
                                                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-auto" />
                                                          )}
                                                         </div>
                                                      </div>
                                                    )
                                                  })}
                                                </div>

                                                {/* Explanation */}
                                                {expandedMcqData.explanation && (
                                                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
                                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                                      ব্যাখ্যা: <RichContentRenderer content={expandedMcqData.explanation} className="text-sm" inline />
                                                      {expandedMcqData.explanationImage && (
                                                        <SafeImage src={expandedMcqData.explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                                                      )}
                                                    </p>
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <p className="text-sm text-muted-foreground text-center">প্রশ্ন লোড করতে সমস্যা হয়েছে</p>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Floating practice button */}
              {activeTab === 'mcq' && freeMcqCount > 0 && (
                <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                  <Button
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/30 h-12 px-6 rounded-full pointer-events-auto"
                    onClick={handleStartMcqPractice}
                  >
                    <Zap className="size-5" />
                    প্র্যাকটিস শুরু ({toBengaliNum(freeMcqCount)}টি ফ্রি MCQ)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )
  }

  // ─── Main Render ──────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === 'select-class' && (
          <motion.div key="class" variants={pageVariants} initial="enter" animate="center" exit="exit">
            {renderClassSelection()}
          </motion.div>
        )}
        {step === 'select-year' && (
          <motion.div key="year" variants={pageVariants} initial="enter" animate="center" exit="exit">
            {renderYearSelection()}
          </motion.div>
        )}
        {step === 'select-board' && (
          <motion.div key="board" variants={pageVariants} initial="enter" animate="center" exit="exit">
            {renderBoardSelection()}
          </motion.div>
        )}
        {step === 'view-questions' && (
          <motion.div key="questions" variants={pageVariants} initial="enter" animate="center" exit="exit">
            {renderQuestions()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Modal */}
      {purchaseModalData && (
        <PurchaseOptionsModal
          open={purchaseModalOpen}
          onOpenChange={(open) => { setPurchaseModalOpen(open); if (!open) setPurchaseModalData(null) }}
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
