'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  FileText,
  FileQuestion,
  AlignLeft,
  BookOpen,
  Archive,
  Crown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Image as ImageIcon,
  Sigma,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useRouterStore, RoutePath } from '@/store/router'
import { useContentTypes } from '@/hooks/use-content-types'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Types ──────────────────────────────────────────────────────

interface ContentItem {
  id: string
  type: 'mcq' | 'cq' | 'lecture'
  title: string
  classLevel: string
  subjectName?: string
  chapterName?: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty?: string
  isPremium: boolean
  hasImage: boolean
  createdAt: string
}

interface ContentStats {
  totalMcq: number
  totalCq: number
  totalLectures: number
  totalWithImages: number
  totalBoard: number
  totalPremium: number
}

// ─── Constants ──────────────────────────────────────────────────



const difficultyLabels: Record<string, string> = { easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন' }
const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}



const FALLBACK_TYPE_CONFIG = {
  mcq: { label: 'MCQ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: FileQuestion },
  cq: { label: 'CQ', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', icon: AlignLeft },
  lecture: { label: 'লেকচার', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: BookOpen },
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminContentPage() {
  const { navigate } = useRouterStore()
  const { contentTypesWithIcons } = useContentTypes()
  const { classLevelLabels, boardOptions, boardSlugToLabel } = useHierarchyMetadata()

  // Build typeConfig dynamically from DB content types
  const typeConfig: Record<string, { label: string; color: string; icon: typeof FileQuestion }> = {}
  for (const ct of contentTypesWithIcons) {
    if (['mcq', 'cq', 'lecture'].includes(ct.key)) {
      typeConfig[ct.key] = {
        label: ct.labelBn,
        color: `${ct.lightColor || 'bg-gray-100'} ${ct.textColor || 'text-gray-700'}`,
        icon: ct.Icon as typeof FileQuestion,
      }
    }
  }
  for (const [key, val] of Object.entries(FALLBACK_TYPE_CONFIG)) {
    if (!typeConfig[key]) typeConfig[key] = val
  }
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<ContentItem[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<ContentStats>({ totalMcq: 0, totalCq: 0, totalLectures: 0, totalWithImages: 0, totalBoard: 0, totalPremium: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [boardFilter, setBoardFilter] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 12

  // Preview
  const [previewItem, setPreviewItem] = useState<{ type: string; id: string; data?: Record<string, unknown> } | null>(null)

  // Classes for filter
  const [classes, setClasses] = useState<{ id: string; name: string; slug: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/classes')
      .then(r => r.json())
      .then(j => setClasses(Array.isArray(j.data) ? j.data : []))
      .catch(() => {})
  }, [])

  // ─── Fetch all content ──────────────────────────────────────
  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all content types in parallel
      const [mcqRes, cqRes, lectureRes] = await Promise.all([
        fetch('/api/admin/mcq?limit=500'),
        fetch('/api/admin/cq?limit=500'),
        fetch('/api/admin/lectures?limit=500'),
      ])

      // Handle both response formats:
      // - New (apiResponse): { success: true, data: { data: [...], pagination: {...} } }
      // - Old (NextResponse.json): { data: [...], pagination: {...} }
      const resolveData = async (res: Response) => {
        if (!res.ok) return []
        const body = await res.json()
        // If body.data is an array, use it directly. Otherwise try body.data.data (nested apiResponse).
        return Array.isArray(body.data) ? body.data : (body.data?.data ?? [])
      }
      const mcqData = await resolveData(mcqRes)
      const cqData = await resolveData(cqRes)
      const lectureData = await resolveData(lectureRes)

      // Map to unified format
      const allContent: ContentItem[] = [
        ...mcqData.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          type: 'mcq' as const,
          title: (m.question as string) || '',
          classLevel: (m.classLevel as string) || '',
          subjectName: (m as Record<string, unknown>).subjectName as string || '',
          chapterName: ((m as Record<string, unknown>).chapter as Record<string, string>)?.name || '',
          board: (m.board as string) || null,
          year: (m.year as string) || null,
          topic: (m.topic as string) || null,
          difficulty: (m.difficulty as string) || 'medium',
          isPremium: (m.isPremium as boolean) || false,
          hasImage: !!(m.questionImage || m.optionAImage || m.optionBImage || m.optionCImage || m.optionDImage),
          createdAt: (m.createdAt as string) || '',
        })),
        ...cqData.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          type: 'cq' as const,
          title: (c.uddeepok as string) || '',
          classLevel: (c.classLevel as string) || '',
          subjectName: '',
          chapterName: ((c as Record<string, unknown>).chapter as Record<string, string>)?.name || '',
          board: (c.board as string) || null,
          year: (c.year as string) || null,
          topic: (c.topic as string) || null,
          difficulty: (c.difficulty as string) || 'medium',
          isPremium: (c.isPremium as boolean) || false,
          hasImage: !!(c.uddeepokImage || c.question1Image),
          createdAt: (c.createdAt as string) || '',
        })),
        ...lectureData.map((l: Record<string, unknown>) => ({
          id: l.id as string,
          type: 'lecture' as const,
          title: (l.title as string) || '',
          classLevel: '',
          subjectName: '',
          chapterName: ((l as Record<string, unknown>).chapter as Record<string, string>)?.name || '',
          board: null,
          year: null,
          topic: null,
          difficulty: '',
          isPremium: (l.isPremium as boolean) || false,
          hasImage: !!((l as Record<string, unknown>).thumbnail),
          createdAt: (l.createdAt as string) || '',
        })),
      ]

      // Calculate stats
      setStats({
        totalMcq: mcqData.length,
        totalCq: cqData.length,
        totalLectures: lectureData.length,
        totalWithImages: allContent.filter(c => c.hasImage).length,
        totalBoard: allContent.filter(c => c.board).length,
        totalPremium: allContent.filter(c => c.isPremium).length,
      })

      setContent(allContent)
      setTotal(allContent.length)
    } catch (err) {
      console.error('Error fetching content:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContent() }, [fetchContent])

  // ─── Apply filters ──────────────────────────────────────────
  const filteredContent = content.filter(item => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (classFilter !== 'all' && item.classLevel !== classFilter) return false
    if (premiumFilter === 'premium' && !item.isPremium) return false
    if (premiumFilter === 'free' && item.isPremium) return false
    if (boardFilter !== 'all' && item.board !== boardFilter) return false
    return true
  })

  const paginatedContent = filteredContent.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filteredContent.length / perPage)

  // Navigate to specific management page
  const goToManagement = (type: string) => {
    const routeMap: Record<string, RoutePath> = {
      mcq: 'admin-mcq',
      cq: 'admin-cq',
      lecture: 'admin-lectures',
      board: 'admin-board',
    }
    if (routeMap[type]) navigate(routeMap[type])
  }

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            কন্টেন্ট ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            সকল কন্টেন্টের সামগ্রিক দৃশ্যপট
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => goToManagement('board')}>
            <Archive className="h-4 w-4" />
            বোর্ড প্রশ্ন
          </Button>
        </div>
      </div>

      {/* ─── Statistics Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all" onClick={() => goToManagement('mcq')}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">MCQ</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalMcq}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-teal-500/50 transition-all" onClick={() => goToManagement('cq')}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlignLeft className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-muted-foreground">CQ</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats.totalCq}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all" onClick={() => goToManagement('lecture')}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">লেকচার</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalLectures}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Archive className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">বোর্ড প্রশ্ন</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.totalBoard}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ImageIcon className="h-4 w-4 text-rose-600" />
              <p className="text-xs text-muted-foreground">ছবিযুক্ত</p>
            </div>
            <p className="text-2xl font-bold text-rose-600">{stats.totalWithImages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Crown className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-muted-foreground">প্রিমিয়াম</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalPremium}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Actions ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold">দ্রুত নেভিগেশন</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" className="gap-2 justify-start" onClick={() => goToManagement('mcq')}>
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              MCQ ব্যবস্থাপনা
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={() => goToManagement('cq')}>
              <AlignLeft className="h-4 w-4 text-teal-600" />
              CQ ব্যবস্থাপনা
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={() => goToManagement('lecture')}>
              <BookOpen className="h-4 w-4 text-purple-600" />
              লেকচার ব্যবস্থাপনা
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={() => goToManagement('board')}>
              <Archive className="h-4 w-4 text-amber-600" />
              বোর্ড প্রশ্ন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Filters ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">ফিল্টার</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="কন্টেন্ট খুঁজুন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="ধরন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ধরন</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="cq">CQ</SelectItem>
                <SelectItem value="lecture">লেকচার</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="ক্লাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ক্লাস</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={boardFilter} onValueChange={(v) => { setBoardFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="বোর্ড" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব বোর্ড</SelectItem>
                {boardOptions.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="প্রিমিয়াম" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                <SelectItem value="free">ফ্রি</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── Content Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedContent.map((item) => {
          const config = typeConfig[item.type]
          const Icon = config.icon
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {item.hasImage && (
                        <ImageIcon className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      {item.isPremium && (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <RichContentRenderer
                      content={item.title.length > 120 ? item.title.slice(0, 120) + '...' : item.title}
                      className="text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.classLevel && (
                      <Badge variant="secondary" className="text-xs">
                        {classLevelLabels[item.classLevel] || item.classLevel}
                      </Badge>
                    )}
                    {item.board && (
                      <Badge variant="secondary" className="text-xs">
                        {boardSlugToLabel[item.board] || item.board}
                      </Badge>
                    )}
                    {item.year && (
                      <Badge variant="secondary" className="text-xs">
                        {item.year}
                      </Badge>
                    )}
                    {item.difficulty && (
                      <Badge className={`text-xs ${difficultyColors[item.difficulty] || ''}`}>
                        {difficultyLabels[item.difficulty]}
                      </Badge>
                    )}
                    {item.topic && (
                      <Badge variant="outline" className="text-xs">
                        {item.topic}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-emerald-600 hover:text-emerald-700"
                      onClick={() => goToManagement(item.type)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      দেখুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Empty State ──────────────────────────────────────── */}
      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">কোনো কন্টেন্ট পাওয়া যায়নি</h3>
            <p className="text-muted-foreground text-sm">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Pagination ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredContent.length)} / {filteredContent.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="icon"
                  className={`h-8 w-8 ${page === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Math Help Dialog ─────────────────────────────────── */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sigma className="h-5 w-5 text-emerald-600" />
              গণিত সমীকরণ লেখার নিয়ম
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">ইনলাইন ম্যাথ:</h4>
                <code className="bg-muted px-2 py-1 rounded">{'$x^2 + y^2 = r^2$'}</code>
                <RichContentRenderer content="ফলাফল: $x^2 + y^2 = r^2$" className="mt-1" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">ব্লক ম্যাথ:</h4>
                <code className="bg-muted px-2 py-1 rounded">{'$$\\frac{a}{b} + \\frac{c}{d}$$'}</code>
                <RichContentRenderer content={'$$\\frac{a}{b} + \\frac{c}{d}$$'} className="mt-1" />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
