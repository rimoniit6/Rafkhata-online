'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Crown,
  Lock,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Search,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ContentBlockEditor, { deserializeBlocks } from '@/components/ui/content-block-editor'
import { cn } from '@/lib/utils'

// ─── Data Model ───────────────────────────────────────────────

interface SuggestionRecord {
  id: string
  title: string
  examName: string
  classId: string | null
  subjectId: string | null
  content: string
  isPremium: boolean
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  class?: { id: string; name: string; slug: string } | null
  subject?: { id: string; name: string; slug: string } | null
}

interface SuggestionApiResponse {
  data: SuggestionRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ClassItem {
  id: string
  name: string
  slug: string
}

// ─── Constants ────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'সকল' },
  { key: 'free', label: 'ফ্রি' },
  { key: 'paid', label: 'পেইড' },
]

// ─── Helpers ──────────────────────────────────────────────────

function formatDateBn(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getBlockCount(content: string): number {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.length
    return 1
  } catch {
    return 1
  }
}

// ─── Animation Variants ───────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
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

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const

// ─── Skeleton Loader ──────────────────────────────────────────

function SuggestionSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-l-4 border-l-muted">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Premium Locked Overlay ───────────────────────────────────

function PremiumLockedOverlay({ price }: { price: number }) {
  const [showMessage, setShowMessage] = useState(false)

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={() => setShowMessage(true)}
    >
      {/* Blurred content placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-yellow-50/60 dark:from-amber-950/30 dark:to-yellow-950/30 backdrop-blur-[3px] z-10 rounded-b-xl" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 z-10 overflow-hidden rounded-b-xl">
        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,oklch(0.75_0.15_85/0.06)_12px,oklch(0.75_0.15_85/0.06)_24px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,oklch(0.55_0.15_85/0.06)_12px,oklch(0.55_0.15_85/0.06)_24px)]" />
      </div>

      {/* Lock overlay */}
      <motion.div
        className="relative z-20 flex flex-col items-center justify-center py-8 px-4"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="relative mb-3"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' } as const}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300/50 dark:border-amber-700/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </motion.div>
        </motion.div>

        {showMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              প্রিমিয়াম আনলক করুন
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1">
              সম্পূর্ণ সাজেশান দেখতে প্রিমিয়ামে আপগ্রেড করুন
            </p>
          </motion.div>
        ) : (
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
            ক্লিক করুন
          </p>
        )}

        {price > 0 && (
          <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[11px]">
            ৳{price}
          </Badge>
        )}
      </motion.div>
    </div>
  )
}

// ─── Suggestion Card ──────────────────────────────────────────

function SuggestionCard({ record }: { record: SuggestionRecord }) {
  const [expanded, setExpanded] = useState(false)
  const blockCount = getBlockCount(record.content)

  return (
    <motion.div variants={cardVariants} layout>
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300',
          'backdrop-blur-sm bg-card/80 dark:bg-card/60',
          'hover:shadow-lg',
          record.isPremium
            ? 'hover:shadow-amber-500/10 dark:hover:shadow-amber-500/10 border-l-4 border-l-amber-400 dark:border-l-amber-600'
            : 'hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/10 border-l-4 border-l-emerald-500 dark:border-l-emerald-600',
        )}
      >
        <CardContent className="p-0">
          {/* ── Card Header Area ── */}
          <div
            className="p-5 space-y-3 cursor-pointer"
            onClick={() => {
              if (!record.isPremium) setExpanded((prev) => !prev)
            }}
            role={record.isPremium ? undefined : 'button'}
            tabIndex={record.isPremium ? undefined : 0}
            onKeyDown={(e) => {
              if (!record.isPremium && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                setExpanded((prev) => !prev)
              }
            }}
          >
            {/* Top row: Exam name badge + Premium/Free badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Exam name badge - prominent */}
                <Badge
                  className={cn(
                    'gap-1 text-[11px] font-bold px-3 py-1',
                    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-sm shadow-emerald-500/20',
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {record.examName}
                </Badge>

                {/* Free / Premium badge */}
                {record.isPremium ? (
                  <Badge
                    className={cn(
                      'gap-1 text-[11px] font-semibold',
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    )}
                  >
                    <Crown className="h-3 w-3 fill-amber-500 dark:fill-amber-400" />
                    প্রিমিয়াম
                    {record.price > 0 && (
                      <span className="ml-0.5 font-bold">৳{record.price}</span>
                    )}
                  </Badge>
                ) : (
                  <Badge
                    className={cn(
                      'gap-1 text-[11px] font-semibold',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    )}
                  >
                    ফ্রি
                  </Badge>
                )}
              </div>

              {/* Expand indicator for free items */}
              {!record.isPremium && (
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg leading-snug text-foreground">
              {record.title}
            </h3>

            {/* Class & Subject badges */}
            {(record.class || record.subject) && (
              <div className="flex items-center gap-2 flex-wrap">
                {record.class && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] font-medium"
                  >
                    <GraduationCap className="h-3 w-3" />
                    {record.class.name}
                  </Badge>
                )}
                {record.subject && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[11px] font-medium"
                  >
                    <BookOpen className="h-3 w-3" />
                    {record.subject.name}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer: date + block count */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 opacity-50" />
                <time dateTime={record.createdAt}>
                  {formatDateBn(record.createdAt)}
                </time>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/60">
                  {blockCount}টি ব্লক
                </span>
              </div>
            </div>
          </div>

          {/* ── Expanded Content Area ── */}
          <AnimatePresence>
            {expanded && !record.isPremium && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' } as const}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-2 border-t border-border/40">
                  <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                    <ContentBlockEditor
                      blocks={deserializeBlocks(record.content)}
                      previewMode
                    />
                  </div>

                  {/* Collapse button */}
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-7 px-3 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded(false)
                      }}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      সংকুচিত করুন
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Premium Locked Overlay ── */}
          {record.isPremium && (
            <div className="border-t border-amber-200/40 dark:border-amber-800/30">
              <PremiumLockedOverlay price={record.price} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function SuggestionPage() {
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  // ── Fetch suggestions ──
  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (selectedClassId && selectedClassId !== 'all') {
        params.set('classId', selectedClassId)
      }

      const res = await fetch(`/api/suggestions?${params.toString()}`)
      if (!res.ok) throw new Error('সাজেশান লোড করতে সমস্যা হয়েছে')

      const json: SuggestionApiResponse = await res.json()
      setSuggestions(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অজানা ত্রুটি')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  // ── Fetch classes ──
  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      if (!res.ok) return
      const json = await res.json()
      setClasses(Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []))
    } catch {
      // Silently fail — class filter is optional
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  // ── Client-side filter + search ──
  const filteredSuggestions = suggestions.filter((s) => {
    // Filter by free/paid
    if (activeFilter === 'free' && s.isPremium) return false
    if (activeFilter === 'paid' && !s.isPremium) return false

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        s.title.toLowerCase().includes(q) ||
        s.examName.toLowerCase().includes(q) ||
        (s.class?.name?.toLowerCase().includes(q) ?? false) ||
        (s.subject?.name?.toLowerCase().includes(q) ?? false)
      )
    }

    return true
  })

  // ── Sort by createdAt desc ──
  const sortedSuggestions = [...filteredSuggestions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-4 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* ── Page Header ── */}
        <motion.header
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shadow-sm">
              <Lightbulb className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                সাজেশান
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                বিভিন্ন এক্সামের সাজেশান ও গাইডলাইন
              </p>
            </div>
          </div>
        </motion.header>

        {/* ── Search Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="সাজেশান খুঁজুন…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-card/80 backdrop-blur-sm border-border/60"
            />
          </div>
        </motion.div>

        {/* ── Filter Tabs + Class Dropdown ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3"
        >
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key
              return (
                <Button
                  key={tab.key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25'
                      : 'hover:bg-accent/50',
                  )}
                  onClick={() => setActiveFilter(tab.key as 'all' | 'free' | 'paid')}
                >
                  {tab.key === 'free' && (
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {tab.key === 'paid' && (
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {tab.label}
                </Button>
              )
            })}
          </div>

          {/* Class filter dropdown */}
          <div className="sm:ml-auto">
            <Select
              value={selectedClassId}
              onValueChange={(val) => setSelectedClassId(val)}
            >
              <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-sm border-border/60">
                <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="শ্রেণি নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল শ্রেণি</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <SuggestionSkeletonGrid />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
              <Lightbulb className="h-8 w-8 text-rose-500" />
            </div>
            <p className="text-lg font-medium text-rose-600 dark:text-rose-400">
              ত্রুটি হয়েছে
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={fetchSuggestions}
            >
              আবার চেষ্টা করুন
            </Button>
          </motion.div>
        ) : sortedSuggestions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              কোনো সাজেশান পাওয়া যায়নি
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              বর্তমানে কোনো সাজেশান নেই। পরে আবার দেখুন।
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeFilter}-${selectedClassId}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {sortedSuggestions.map((record) => (
                <SuggestionCard key={record.id} record={record} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Results count ── */}
        {!loading && !error && sortedSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-muted-foreground/60 pt-2"
          >
            মোট {sortedSuggestions.length}টি সাজেশান পাওয়া গেছে
          </motion.div>
        )}
      </div>
    </div>
  )
}
