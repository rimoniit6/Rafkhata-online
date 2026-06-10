'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Pin,
  AlertTriangle,
  Info,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'

// ─── Data Model ───────────────────────────────────────────────
interface NoticeRecord {
  id: string
  title: string
  content: string
  type: string
  isPinned: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface NoticeApiResponse {
  data: NoticeRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Constants ────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { label: string; badgeColor: string; icon: React.ElementType; borderColor: string; glowColor: string }
> = {
  general: {
    label: 'সাধারণ',
    badgeColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: Info,
    borderColor: 'border-l-emerald-500',
    glowColor: 'shadow-emerald-500/10',
  },
  urgent: {
    label: 'জরুরি',
    badgeColor:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: AlertTriangle,
    borderColor: 'border-l-rose-500',
    glowColor: 'shadow-rose-500/10',
  },
  important: {
    label: 'গুরুত্বপূর্ণ',
    badgeColor:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Megaphone,
    borderColor: 'border-l-amber-500',
    glowColor: 'shadow-amber-500/10',
  },
  announcement: {
    label: 'ঘোষণা',
    badgeColor:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Bell,
    borderColor: 'border-l-purple-500',
    glowColor: 'shadow-purple-500/10',
  },
}

const FILTER_TABS = [
  { key: 'all', label: 'সকল' },
  { key: 'general', label: 'সাধারণ' },
  { key: 'urgent', label: 'জরুরি' },
  { key: 'important', label: 'গুরুত্বপূর্ণ' },
  { key: 'announcement', label: 'ঘোষণা' },
]

// Content length threshold for expand/collapse
const CONTENT_PREVIEW_LENGTH = 280

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

// ─── Animation Variants ───────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

const pinPulse = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ─── Skeleton Loader ──────────────────────────────────────────
function NoticeSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-muted overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Notice Card ──────────────────────────────────────────────
function NoticeCard({ notice }: { notice: NoticeRecord }) {
  const [expanded, setExpanded] = useState(false)

  const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG.general
  const TypeIcon = cfg.icon
  const isLongContent = notice.content.length > CONTENT_PREVIEW_LENGTH
  const displayContent = expanded
    ? notice.content
    : notice.content.slice(0, CONTENT_PREVIEW_LENGTH)

  return (
    <motion.div variants={cardVariants} layout>
      <Card
        className={cn(
          'border-l-4 overflow-hidden transition-all duration-300',
          'backdrop-blur-sm bg-card/80 dark:bg-card/60',
          'hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10',
          cfg.borderColor,
          cfg.glowColor,
          notice.isPinned && 'ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 bg-emerald-50/50 dark:bg-emerald-950/20'
        )}
      >
        <CardContent className="p-5 space-y-3">
          {/* Top row: type badge + pin badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn('gap-1 text-[11px] font-medium', cfg.badgeColor)}
              >
                <TypeIcon className="h-3 w-3" />
                {cfg.label}
              </Badge>
              {notice.isPinned && (
                <motion.div
                  {...pinPulse}
                  className="inline-flex"
                >
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
                    <Pin className="h-3 w-3 fill-emerald-600 dark:fill-emerald-400" />
                    পিন করা
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className={cn(
              'font-bold text-lg leading-snug',
              notice.type === 'urgent' && 'text-rose-700 dark:text-rose-400',
              notice.type === 'important' && 'text-amber-700 dark:text-amber-400',
              notice.isPinned && 'text-emerald-800 dark:text-emerald-300'
            )}
          >
            {notice.title}
          </h3>

          {/* Content with RichContentRenderer */}
          {notice.content && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              <RichContentRenderer
                content={displayContent}
                className="text-sm text-muted-foreground leading-relaxed"
              />
              {isLongContent && !expanded && (
                <span className="text-muted-foreground">…</span>
              )}
            </div>
          )}

          {/* Expand / Collapse toggle */}
          {isLongContent && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  কম দেখুন
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  আরও দেখুন
                </>
              )}
            </Button>
          )}

          {/* Footer: date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <Bell className="h-3 w-3 opacity-50" />
            <time dateTime={notice.createdAt}>{formatDateBn(notice.createdAt)}</time>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function NoticePage() {
  const [notices, setNotices] = useState<NoticeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Fetch notices ──
  const fetchNotices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (activeFilter && activeFilter !== 'all') {
        params.set('type', activeFilter)
      }

      const res = await fetch(`/api/notices?${params.toString()}`)
      if (!res.ok) throw new Error('নোটিশ লোড করতে সমস্যা হয়েছে')

      const json: NoticeApiResponse = await res.json()
      setNotices(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অজানা ত্রুটি')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // ── Client-side search ──
  const filteredNotices = notices.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  })

  // ── Sort: pinned first, then by createdAt desc ──
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // ── Separate pinned for special section ──
  const pinnedNotices = sortedNotices.filter((n) => n.isPinned)
  const regularNotices = sortedNotices.filter((n) => !n.isPinned)

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
              <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                নোটিশ বোর্ড
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                সকল গুরুত্বপূর্ণ নোটিশ ও ঘোষণা এক জায়গায়
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
              placeholder="নোটিশ খুঁজুন…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-card/80 backdrop-blur-sm border-border/60"
            />
          </div>
        </motion.div>

        {/* ── Type Filter Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex flex-wrap gap-2"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key
            const tabCfg = tab.key !== 'all' ? TYPE_CONFIG[tab.key] : null

            return (
              <Button
                key={tab.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tabCfg && <tabCfg.icon className="h-3.5 w-3.5 mr-1.5" />}
                {tab.label}
              </Button>
            )
          })}
        </motion.div>

        {/* ── Content ── */}
        {loading ? (
          <NoticeSkeletonGrid />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <p className="text-lg font-medium text-rose-600 dark:text-rose-400">
              ত্রুটি হয়েছে
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={fetchNotices}
            >
              আবার চেষ্টা করুন
            </Button>
          </motion.div>
        ) : sortedNotices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              কোনো নোটিশ পাওয়া যায়নি
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              বর্তমানে কোনো নোটিশ নেই। পরে আবার দেখুন।
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* ── Pinned Notices Section ── */}
              {pinnedNotices.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                    <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      পিন করা নোটিশ
                    </h2>
                    <div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedNotices.map((notice) => (
                      <NoticeCard key={notice.id} notice={notice} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Regular Notices Section ── */}
              {regularNotices.length > 0 && (
                <section className="space-y-4">
                  {pinnedNotices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        সাম্প্রতিক নোটিশ
                      </h2>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {regularNotices.map((notice) => (
                      <NoticeCard key={notice.id} notice={notice} />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
