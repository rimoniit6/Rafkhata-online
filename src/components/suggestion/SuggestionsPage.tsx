'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, Search, Crown, Eye, BookOpen, FileText,
  Sigma, ImagePlus, Code2, Table2, Link2, GraduationCap,
  ArrowLeft, CheckCircle2, Lock, Clock, AlertCircle,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { setSuggestionsCache } from '@/lib/suggestion-cache'
import SafeImage from '@/components/ui/safe-image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'

interface SuggestionRecord {
  id: string
  title: string
  slug: string
  content: string | null
  thumbnail: string | null
  pdfUrl: string | null
  classId: string | null
  subjectId: string | null
  chapterId: string | null
  isPremium: boolean
  price: number | null
  isActive: boolean
  order: number
  viewCount: number
  className?: string
  subjectName?: string
  chapterName?: string
  createdAt: string
}

interface ClassOption {
  id: string
  name: string
}

interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
}

/** Ensure a value is always an array, regardless of what the API returns */
function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    for (const key of ['data', 'classes', 'items', 'results', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
  }
  return [] as T[]
}

function getContentTypes(content: string | null): string[] {
  if (!content) return []
  try {
    const blocks = JSON.parse(content)
    const types = [...new Set(blocks.map((b: any) => b.type))] as string[]
    return types.filter((t) => ['math', 'image', 'pdf', 'link', 'data', 'code'].includes(t))
  } catch {
    return []
  }
}

const contentTypeIcons: Record<string, { icon: typeof Sigma; label: string; color: string }> = {
  math: { icon: Sigma, label: 'ম্যাথ', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  image: { icon: ImagePlus, label: 'ছবি', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
  pdf: { icon: FileText, label: 'পিডিএফ', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30' },
  link: { icon: Link2, label: 'লিংক', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30' },
  data: { icon: Table2, label: 'ডাটা', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
  code: { icon: Code2, label: 'কোড', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
}

export default function SuggestionsPage() {
  const { navigate, goBack, params: routeParams } = useRouterStore()
  const { user } = useAuthStore()
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState<string>('')
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Chapter-level context from route params (when navigating from chapter detail)
  const chapterId = routeParams.chapterId || ''
  const subjectId = routeParams.subjectId || ''
  const classSlug = routeParams.classSlug || ''

  // Chapter info for breadcrumb (fetched when navigating from chapter)
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subjectName: string; className: string } | null>(null)

  // Purchase status for premium suggestions
  const [purchaseMap, setPurchaseMap] = useState<Record<string, PurchaseStatus>>({})
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseModalData, setPurchaseModalData] = useState<{
    contentType: string; contentId: string; contentTitle: string; contentPrice: number; classLevel: string
  } | null>(null)

  // Is this page accessed from a chapter context?
  const isChapterContext = !!chapterId

  // Fetch chapter info for breadcrumb
  useEffect(() => {
    if (!chapterId) return
    const fetchChapterInfo = async () => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`)
        if (res.ok) {
          const data = await res.json()
          setChapterInfo({
            name: data.name || '',
            subjectName: data.subjectName || '',
            className: data.className || '',
          })
        }
      } catch { /* ignore */ }
    }
    fetchChapterInfo()
  }, [chapterId])

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes')
        if (res.ok) {
          const json = await res.json()
          setClasses(json.data?.classes || ensureArray<ClassOption>(json))
        } else {
          setClasses([])
        }
      } catch {
        setClasses([])
      }
    }
    fetchClasses()
  }, [])

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        })
        if (search) params.set('search', search)
        if (classId) params.set('classId', classId)
        if (chapterId) params.set('chapterId', chapterId)

        const res = await fetch(`/api/suggestions?${params}`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        const items = ensureArray<SuggestionRecord>(json)
        setSuggestions(items)
        setTotalPages(
          json.pagination && typeof json.pagination.totalPages === 'number'
            ? json.pagination.totalPages
            : 1
        )
        setSuggestionsCache(items)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestions()
  }, [search, classId, page, chapterId])

  // Batch check purchase status for premium suggestions
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
            items: premiumItems.map(s => ({
              contentType: 'suggestion',
              contentId: s.id,
            })),
          }),
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const newMap: Record<string, PurchaseStatus> = {}
          for (const item of items) {
            newMap[item.contentId] = {
              purchased: item.purchased || false,
              pendingPayment: item.pendingPayment || false,
            }
          }
          setPurchaseMap(newMap)
        }
      } catch {
        // Silently fail
      }
    }
    checkPurchases()
  }, [suggestions, user?.id])

  const isPremiumUser = user?.isPremium && !!user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()

  const isSuggestionLocked = (s: SuggestionRecord) => {
    return s.isPremium && !isPremiumUser && !purchaseMap[s.id]?.purchased && !purchaseMap[s.id]?.pendingPayment
  }

  const handleCardClick = (suggestion: SuggestionRecord) => {
    if (purchaseMap[suggestion.id]?.pendingPayment && !purchaseMap[suggestion.id]?.purchased) {
      navigate('suggestion-detail', { suggestionId: suggestion.id })
      return
    }
    if (isSuggestionLocked(suggestion)) {
      setPurchaseModalData({
        contentType: 'suggestion',
        contentId: suggestion.id,
        contentTitle: suggestion.title,
        contentPrice: suggestion.price || 0,
        classLevel: suggestion.className || classSlug,
      })
      setPurchaseModalOpen(true)
      return
    }
    navigate('suggestion-detail', { suggestionId: suggestion.id })
  }

  const handleLockedClick = (s: SuggestionRecord) => {
    if (purchaseMap[s.id]?.pendingPayment && !purchaseMap[s.id]?.purchased) {
      navigate('suggestion-detail', { suggestionId: s.id })
      return
    }
    setPurchaseModalData({
      contentType: 'suggestion',
      contentId: s.id,
      contentTitle: s.title,
      contentPrice: s.price || 0,
      classLevel: s.className || classSlug,
    })
    setPurchaseModalOpen(true)
  }

  // Separate free/purchased/pending/locked suggestions
  const { freeSuggestions, purchasedSuggestions, pendingSuggestions, lockedSuggestions } = (() => {
    const free: SuggestionRecord[] = []
    const purchased: SuggestionRecord[] = []
    const pending: SuggestionRecord[] = []
    const locked: SuggestionRecord[] = []

    for (const s of suggestions) {
      if (!s.isPremium || isPremiumUser) {
        free.push(s)
      } else if (purchaseMap[s.id]?.purchased) {
        purchased.push(s)
      } else if (purchaseMap[s.id]?.pendingPayment) {
        pending.push(s)
      } else {
        locked.push(s)
      }
    }
    return { freeSuggestions: free, purchasedSuggestions: purchased, pendingSuggestions: pending, lockedSuggestions: locked }
  })()

  // Page title
  const pageTitle = isChapterContext
    ? `${chapterInfo?.name || 'অধ্যায়'} - সাজেশন`
    : 'সাজেশন'

  const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - only show when in chapter context */}
      {isChapterContext && (
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-violet-500 via-purple-600 to-violet-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent)]" />
          <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2" onClick={goBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{pageTitle}</h1>
                {chapterInfo?.subjectName && <p className="text-violet-100 text-sm mt-0.5">{chapterInfo.subjectName}</p>}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Breadcrumb - only when in chapter context */}
      {isChapterContext && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {classSlug && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug })}>
                      {chapterInfo?.className || classSlug}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {subjectId && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId, classSlug })}>
                      {chapterInfo?.subjectName || 'বিষয়'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {chapterId && chapterInfo?.name && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('chapter-detail', { chapterId, subjectId, classSlug })}>
                      {chapterInfo.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>সাজেশন</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Stats for chapter context */}
      {isChapterContext && (
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {freeSuggestions.length > 0 && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 px-3 py-1 text-sm">
                <Eye className="size-3.5" />
                ফ্রি {toBengaliNum(freeSuggestions.length)}টি
              </Badge>
            )}
            {purchasedSuggestions.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 px-3 py-1 text-sm">
                <CheckCircle2 className="size-3.5" />
                কেনা {toBengaliNum(purchasedSuggestions.length)}টি
              </Badge>
            )}
            {pendingSuggestions.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1 px-3 py-1 text-sm">
                <Clock className="size-3.5" />
                অপেক্ষমাণ {toBengaliNum(pendingSuggestions.length)}টি
              </Badge>
            )}
            {lockedSuggestions.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 px-3 py-1 text-sm">
                <Lock className="size-3.5" />
                প্রিমিয়াম {toBengaliNum(lockedSuggestions.length)}টি
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              মোট {toBengaliNum(suggestions.length)}টি সাজেশন
            </span>
          </div>
        </div>
      )}

      {/* Header - standalone mode (not from chapter) */}
      {!isChapterContext && (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">সাজেশন</h1>
                  <p className="text-xs text-muted-foreground">পরীক্ষার জন্য গুরুত্বপূর্ণ সাজেশন ও নোটস</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {suggestions.length}টি সাজেশন
              </Badge>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="সাজেশন খুঁজুন..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-10 h-10 bg-muted/30 border-border/50"
                />
              </div>
              <Select value={classId} onValueChange={(v) => { setClassId(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/30 border-border/50">
                  <GraduationCap className="w-4 h-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="শ্রেণি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">সকল শ্রেণি</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn("px-4 py-6", isChapterContext ? "max-w-5xl mx-auto" : "max-w-6xl mx-auto")}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-40 bg-muted/50 animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-muted/50 rounded-full animate-pulse w-12" />
                      <div className="h-5 bg-muted/50 rounded-full animate-pulse w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : suggestions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 border border-border/50">
                <Lightbulb className="w-9 h-9 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">শীঘ্রই কন্টেন্ট আসবে</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isChapterContext
                  ? 'এই অধ্যায়ের সাজেশন শীঘ্রই যোগ করা হবে'
                  : 'আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'}
              </p>
              {isChapterContext && (
                <Button variant="outline" className="mt-4 gap-2" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                  ফিরে যান
                </Button>
              )}
            </motion.div>
          ) : isChapterContext ? (
            // Chapter context: list layout with free/purchased/locked sections
            <motion.div
              key="chapter-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Free Suggestions */}
              {freeSuggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      ফ্রি সাজেশন ({toBengaliNum(freeSuggestions.length)}টি)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {freeSuggestions.map((suggestion, index) => (
                        <SuggestionListItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          index={index}
                          variant="free"
                          onClick={() => handleCardClick(suggestion)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Purchased Suggestions */}
              {purchasedSuggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      কেনা প্রিমিয়াম সাজেশন ({toBengaliNum(purchasedSuggestions.length)}টি)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {purchasedSuggestions.map((suggestion, index) => (
                        <SuggestionListItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          index={index}
                          variant="purchased"
                          onClick={() => handleCardClick(suggestion)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Pending Suggestions */}
              {pendingSuggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full bg-yellow-500" />
                    <Clock className="size-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                      অপেক্ষমাণ ({toBengaliNum(pendingSuggestions.length)}টি)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {pendingSuggestions.map((suggestion, index) => (
                        <SuggestionListItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          index={index}
                          variant="pending"
                          onClick={() => handleCardClick(suggestion)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Locked Suggestions */}
              {lockedSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                    <Crown className="size-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      প্রিমিয়াম সাজেশন ({toBengaliNum(lockedSuggestions.length)}টি)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {lockedSuggestions.map((suggestion, index) => (
                        <SuggestionListItem
                          key={suggestion.id}
                          suggestion={suggestion}
                          index={index}
                          variant="locked"
                          onClick={() => handleCardClick(suggestion)}
                          onBuyClick={() => handleLockedClick(suggestion)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // Standalone mode: grid layout
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {suggestions.map((suggestion, index) => {
                  const contentTypes = getContentTypes(suggestion.content)
                  const isPremium = suggestion.isPremium
                  const isLockedSuggestion = isSuggestionLocked(suggestion)

                  return (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      layout
                    >
                      <Card
                        className={cn(
                          "overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 border-border/50",
                          isLockedSuggestion && 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
                        )}
                        onClick={() => handleCardClick(suggestion)}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-40 overflow-hidden">
                          {suggestion.thumbnail ? (
                            <SafeImage
                              src={suggestion.thumbnail}
                              alt={suggestion.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40 flex items-center justify-center">
                              <Lightbulb className="w-10 h-10 text-violet-300 dark:text-violet-700" />
                            </div>
                          )}

                          {/* Premium badge overlay */}
                          {isPremium && !isLockedSuggestion && !purchaseMap[suggestion.id]?.pendingPayment && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-emerald-500/90 text-white border-0 gap-1 shadow-lg">
                                <CheckCircle2 className="w-3 h-3" />
                                কেনা
                              </Badge>
                            </div>
                          )}

                          {isPremium && purchaseMap[suggestion.id]?.pendingPayment && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500/90 text-white border-0 gap-1 shadow-lg shadow-yellow-500/20">
                                <Clock className="w-3 h-3" />
                                অপেক্ষমাণ
                              </Badge>
                            </div>
                          )}

                          {isPremium && isLockedSuggestion && !purchaseMap[suggestion.id]?.pendingPayment && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-amber-500/90 text-white border-0 gap-1 shadow-lg shadow-amber-500/20">
                                <Crown className="w-3 h-3 fill-amber-200/50" />
                                প্রিমিয়াম
                              </Badge>
                            </div>
                          )}

                          {!isPremium && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500/90 text-white border-0 shadow-lg shadow-green-500/20">
                                ফ্রি
                              </Badge>
                            </div>
                          )}

                          {/* View count */}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] gap-1 backdrop-blur-sm">
                              <Eye className="w-3 h-3" />
                              {suggestion.viewCount}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          {/* Title */}
                          <h3 className={cn(
                            "font-semibold text-sm line-clamp-2 transition-colors",
                            isLockedSuggestion ? 'text-foreground/60' : 'group-hover:text-violet-600 dark:group-hover:text-violet-400'
                          )}>
                            {suggestion.title}
                          </h3>

                          {/* Class/Subject/Chapter badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {suggestion.className && (
                              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400">
                                <GraduationCap className="w-2.5 h-2.5" />
                                {suggestion.className}
                              </Badge>
                            )}
                            {suggestion.subjectName && (
                              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                                <BookOpen className="w-2.5 h-2.5" />
                                {suggestion.subjectName}
                              </Badge>
                            )}
                            {suggestion.chapterName && (
                              <Badge variant="outline" className="text-[10px] h-5 gap-1 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
                                <FileText className="w-2.5 h-2.5" />
                                {suggestion.chapterName}
                              </Badge>
                            )}
                          </div>

                          {/* Content type indicators */}
                          {contentTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {contentTypes.map((type) => {
                                const config = contentTypeIcons[type]
                                if (!config) return null
                                const Icon = config.icon
                                return (
                                  <span
                                    key={type}
                                    className={cn(
                                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium',
                                      config.color,
                                    )}
                                  >
                                    <Icon className="w-2.5 h-2.5" />
                                    {config.label}
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          {/* Price for locked */}
                          {isLockedSuggestion && suggestion.price ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <Crown className="w-3.5 h-3.5" />
                              <span className="text-sm font-semibold">৳{suggestion.price}</span>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              আগের পাতা
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              পরের পাতা
            </Button>
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

// ─── Suggestion List Item (for chapter context) ─────────────────────

function SuggestionListItem({
  suggestion,
  index,
  variant,
  onClick,
  onBuyClick,
}: {
  suggestion: SuggestionRecord
  index: number
  variant: 'free' | 'purchased' | 'pending' | 'locked'
  onClick: () => void
  onBuyClick?: () => void
}) {
  const contentTypes = getContentTypes(suggestion.content)
  const isLocked = variant === 'locked'

  const variantStyles = {
    free: {
      accent: 'bg-violet-500',
      badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      badgeIcon: <Eye className="size-3" />,
      badgeText: 'ফ্রি',
      iconBg: 'bg-green-50 dark:bg-green-950/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    purchased: {
      accent: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
      badgeIcon: <CheckCircle2 className="size-3" />,
      badgeText: 'কেনা',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    locked: {
      accent: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
      badgeIcon: <Lock className="size-3" />,
      badgeText: 'প্রিমিয়াম',
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    pending: {
      accent: 'bg-yellow-500',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      badgeIcon: <Clock className="size-3" />,
      badgeText: 'অপেক্ষমাণ',
      iconBg: 'bg-yellow-50 dark:bg-yellow-950/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  }

  const style = variantStyles[variant]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Card
        className={cn(
          'group cursor-pointer hover:shadow-md transition-all relative overflow-hidden',
          isLocked && 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',
          variant === 'purchased' && 'border-emerald-200 dark:border-emerald-800',
        )}
        onClick={onClick}
      >
        <div className={cn('absolute left-0 top-0 bottom-0 w-1', style.accent)} />
        <CardContent className="p-4 pl-5">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', style.iconBg)}>
              <Lightbulb className={cn('size-5', style.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-medium text-sm leading-relaxed line-clamp-1 flex-1',
                  isLocked ? 'text-foreground/60' : 'text-foreground'
                )}>
                  {suggestion.title}
                </h3>
                <Badge className={cn('text-xs gap-1 shrink-0', style.badge)}>
                  {style.badgeIcon} {style.badgeText}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {suggestion.className && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400">
                    <GraduationCap className="w-2.5 h-2.5" />
                    {suggestion.className}
                  </Badge>
                )}
                {suggestion.subjectName && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1">
                    <BookOpen className="w-2.5 h-2.5" />
                    {suggestion.subjectName}
                  </Badge>
                )}
                {contentTypes.length > 0 && (
                  contentTypes.slice(0, 3).map((type) => {
                    const config = contentTypeIcons[type]
                    if (!config) return null
                    const Icon = config.icon
                    return (
                      <span
                        key={type}
                        className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium',
                          config.color,
                        )}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {config.label}
                      </span>
                    )
                  })
                )}
              </div>
              {/* Buy button for locked */}
              {variant === 'locked' && suggestion.price && suggestion.price > 0 && onBuyClick && (
                <Button
                  size="sm"
                  className="mt-2 gap-1 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={(e) => { e.stopPropagation(); onBuyClick() }}
                >
                  <Lock className="size-3" /> ৳{suggestion.price} - কিনুন
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
