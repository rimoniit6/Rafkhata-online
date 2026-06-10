'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  Search,
  Pin,
  FileText,
  ExternalLink,
  Calendar,
  ArrowLeft,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouterStore } from '@/store/router'
import { cn } from '@/lib/utils'
import { setNoticesCache, type NoticeRecord } from '@/lib/notice-cache'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Constants ──────────────────────────────────────────────────

const typeBadgeConfig: Record<
  NoticeRecord['type'],
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  text: {
    label: 'টেক্সট',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/60',
    borderColor: 'border-l-emerald-500',
  },
  pdf: {
    label: 'পিডিএফ',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/60',
    borderColor: 'border-l-orange-500',
  },
  link: {
    label: 'লিংক',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/60',
    borderColor: 'border-l-cyan-500',
  },
}



// ─── Component ──────────────────────────────────────────────────

export default function NoticesPage() {
  const { navigate, goBack } = useRouterStore()
  const { classOptions, classLevelLabels } = useHierarchyMetadata()
  const allClassOptions = [{ value: 'all', label: 'সকল শ্রেণি' }, ...classOptions]
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState<NoticeRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterClassLevel, setFilterClassLevel] = useState('all')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  )

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (appliedSearch) params.set('search', appliedSearch)
      if (filterClassLevel && filterClassLevel !== 'all')
        params.set('classLevel', filterClassLevel)
      params.set('page', '1')
      params.set('limit', '20')

      const res = await fetch(`/api/notices?${params}`)
      if (res.ok) {
        const json = await res.json()
        const data = Array.isArray(json.data) ? json.data : []
        setNotices(data)
        setNoticesCache(data)
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, filterClassLevel])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // ─── Search with debounce ───────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      setAppliedSearch(value)
    }, 400)
    setSearchTimeout(timeout)
  }

  // ─── Navigation ─────────────────────────────────────────────

  const handleNoticeClick = (noticeId: string) => {
    navigate('notice-detail', { noticeId })
  }

  // ─── Helpers ────────────────────────────────────────────────

  const getContentPreview = (notice: NoticeRecord) => {
    if (notice.type === 'text' && notice.content) {
      const plain = notice.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      return plain.length > 120
        ? plain.slice(0, 120) + '...'
        : plain
    }
    return null
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // ─── Pinned notices sorted to top (API already does this, but just in case) ──

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  // ─── Loading State ──────────────────────────────────────────

  if (loading && notices.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-emerald-500 to-teal-600" />
        <div className="max-w-5xl mx-auto px-4 -mt-8">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-muted/40 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-muted/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative h-28 sm:h-36 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 -ml-2"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                নোটিশ বোর্ড
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5">
                সকল গুরুত্বপূর্ণ নোটিশ ও বিজ্ঞপ্তি
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 pb-8">
        {/* Search & Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-lg mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="নোটিশ খুঁজুন..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-10 bg-card border-border/50"
                  />
                </div>
                <Select
                  value={filterClassLevel}
                  onValueChange={setFilterClassLevel}
                >
                  <SelectTrigger className="h-10 w-full sm:w-44 bg-card border-border/50">
                    <SelectValue placeholder="শ্রেণি ফিল্টার" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClassOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notice Grid */}
        {sortedNotices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {sortedNotices.map((notice, idx) => {
                const badgeConfig = typeBadgeConfig[notice.type]
                return (
                  <motion.div
                    key={notice.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  >
                    <Card
                      className={cn(
                        'cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-lg border-border/50 border-l-4',
                        badgeConfig.borderColor
                      )}
                      onClick={() => handleNoticeClick(notice.id)}
                    >
                      {/* Thumbnail */}
                      {notice.thumbnail && (
                        <div className="relative h-32 overflow-hidden bg-muted/30">
                          <img
                            src={notice.thumbnail}
                            alt={notice.title}
                            className="w-full h-full object-cover"
                          />
                          {notice.isPinned && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-amber-500 text-white text-[10px] h-5 px-1.5 gap-0.5 shadow-md">
                                <Pin className="h-2.5 w-2.5" /> পিন করা
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      <CardContent className="p-4">
                        {/* Title & Badges */}
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-sm line-clamp-2 flex-1 leading-snug">
                            {notice.title}
                          </h3>
                          {!notice.thumbnail && notice.isPinned && (
                            <Pin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          <Badge
                            className={cn(
                              'text-[10px] h-5 px-1.5 shrink-0 border-0',
                              badgeConfig.bgColor,
                              badgeConfig.color
                            )}
                          >
                            {notice.type === 'text' && (
                              <span>টেক্সট</span>
                            )}
                            {notice.type === 'pdf' && (
                              <FileText className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            {notice.type === 'pdf' && 'পিডিএফ'}
                            {notice.type === 'link' && (
                              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            {notice.type === 'link' && 'লিংক'}
                          </Badge>
                          {notice.classLevel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1.5 shrink-0"
                            >
                              {classLevelLabels[notice.classLevel] ||
                                notice.classLevel}
                            </Badge>
                          )}
                          {notice.isPinned && !notice.thumbnail && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] h-5 px-1.5 gap-0.5 shrink-0 border-0">
                              <Pin className="h-2.5 w-2.5" /> পিন করা
                            </Badge>
                          )}
                        </div>

                        {/* Content Preview */}
                        <div className="mb-3">
                          {notice.type === 'text' && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {getContentPreview(notice)}
                            </p>
                          )}
                          {notice.type === 'pdf' && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                              <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                              <span className="text-xs text-orange-700 dark:text-orange-300">
                                PDF ডাউনলোড
                              </span>
                            </div>
                          )}
                          {notice.type === 'link' && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
                              <ExternalLink className="h-4 w-4 text-cyan-500 shrink-0" />
                              <span className="text-xs text-cyan-700 dark:text-cyan-300 truncate">
                                {notice.linkLabel || 'বাহ্যিক লিংক'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notice.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 mb-6">
              <Bell className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              কোনো নোটিশ পাওয়া যায়নি
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
              এই মুহূর্তে কোনো সক্রিয় নোটিশ নেই। পরে আবার দেখুন।
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
