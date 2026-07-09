'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { useContentTypes } from '@/hooks/use-content-types'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useRouterStore } from '@/store/router'
import {
ArrowLeft,
BookOpen,
ChevronRight,
Crown,
FileQuestion,
FileText,
Lightbulb,
Loader2,
Megaphone,
Package,
Search,
X,
} from 'lucide-react'
import { useCallback,useEffect,useMemo,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

interface SearchMCQ {
  id: string
  question: string
  correctAnswer: string
  difficulty: string
  classLevel: string
  isPremium: boolean
  price: number
  chapter?: { id: string; name: string; subject?: { id: string; name: string; class?: { id: string; name: string; slug: string } } }
}

interface SearchCQ {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  difficulty: string
  classLevel: string
  isPremium: boolean
  price: number
  chapter?: { id: string; name: string; subject?: { id: string; name: string; class?: { id: string; name: string; slug: string } } }
}

interface SearchLecture {
  id: string
  title: string
  slug: string
  isPremium: boolean
  price: number
  videoUrl: string | null
  thumbnail: string | null
  duration: number
  chapter?: { id: string; name: string; subject?: { id: string; name: string; class?: { id: string; name: string; slug: string } } }
}

interface SearchSuggestion {
  id: string
  title: string
  slug: string
  isPremium: boolean
  price: number
  thumbnail: string | null
}

interface SearchNotice {
  id: string
  title: string
  type: string
  isPinned: boolean
  createdAt: string
}

interface SearchBundle {
  id: string
  title: string
  slug: string
  price: number
  originalPrice: number
  type: string
  thumbnail: string | null
}

interface SearchResults {
  mcqs?: SearchMCQ[]
  cqs?: SearchCQ[]
  lectures?: SearchLecture[]
  suggestions?: SearchSuggestion[]
  notices?: SearchNotice[]
  bundles?: SearchBundle[]
}

// ─── Constants ──────────────────────────────────────────────────

const difficultyLabels: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
}

// Fallback type filters (used before content types load from DB)
const _FALLBACK_TYPE_FILTERS = [
  { key: 'all', label: 'সব', icon: Search },
  { key: 'lecture', label: 'লেকচার', icon: BookOpen },
  { key: 'mcq', label: 'MCQ', icon: FileQuestion },
  { key: 'cq', label: 'সৃজনশীল প্রশ্ন', icon: FileText },
  { key: 'suggestion', label: 'সাজেশন', icon: Lightbulb },
  { key: 'notice', label: 'নোটিশ', icon: Megaphone },
  { key: 'bundle', label: 'বান্ডেল', icon: Package },
] as const

// ─── Component ──────────────────────────────────────────────────

export default function SearchResultsPage() {
  const { navigate, params } = useRouterStore()
  const { classLevelLabels: classLabelMap } = useHierarchyMetadata()
  const { config } = useSiteConfig()
  const { contentTypesWithIcons, getLabel: _getLabel, getIcon: _getIcon } = useContentTypes()
  const [query, setQuery] = useState(params.searchQuery || '')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [results, setResults] = useState<SearchResults>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Build dynamic type filters from DB content types
  const typeFilters = useMemo(() => {
    const dbFilters = contentTypesWithIcons
      .filter(ct => ['lecture', 'mcq', 'cq', 'suggestion', 'bundle'].includes(ct.key))
      .map(ct => ({ key: ct.key, label: ct.labelBn, icon: ct.Icon }))
    return [
      { key: 'all', label: 'সব', icon: Search },
      ...dbFilters,
      { key: 'notice', label: 'নোটিশ', icon: Megaphone },
    ]
  }, [contentTypesWithIcons])

  const performSearch = useCallback(async (searchQuery: string, type: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const url = `/api/search?q=${encodeURIComponent(searchQuery.trim())}&type=${type}&limit=20`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data?.results || {})
        setTotal(data.data?.total || 0)
      } else {
        setResults({})
        setTotal(0)
      }
    } catch {
      setResults({})
      setTotal(0)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    if (params.searchQuery) {
      setQuery(params.searchQuery)
      performSearch(params.searchQuery, 'all')
    }
  }, [params.searchQuery, performSearch])

  const handleSearch = () => {
    if (query.trim()) {
      setActiveFilter('all')
      performSearch(query, 'all')
    }
  }

  const handleFilterChange = (type: string) => {
    setActiveFilter(type)
    if (query.trim()) {
      performSearch(query, type)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const goToMCQ = (mcq: SearchMCQ) => {
    const chapterId = mcq.chapter?.id
    if (chapterId) {
      navigate('chapter-detail', { chapterId })
    }
  }

  const goToCQ = (cq: SearchCQ) => {
    const chapterId = cq.chapter?.id
    if (chapterId) {
      navigate('cq-list', { chapterId })
    }
  }

  const goToLecture = (lecture: SearchLecture) => {
    navigate('lecture-viewer', { lectureId: lecture.id })
  }

  const goToSuggestion = (suggestion: SearchSuggestion) => {
    navigate('suggestion-detail', { suggestionId: suggestion.id })
  }

  const goToNotice = (notice: SearchNotice) => {
    navigate('notice-detail', { noticeId: notice.id })
  }

  const goToBundle = (bundle: SearchBundle) => {
    navigate('premium', { bundleId: bundle.id })
  }

  const mcqCount = results.mcqs?.length || 0
  const cqCount = results.cqs?.length || 0
  const lectureCount = results.lectures?.length || 0
  const suggestionCount = results.suggestions?.length || 0
  const noticeCount = results.notices?.length || 0
  const bundleCount = results.bundles?.length || 0

  return (
    <div className="min-h-screen pb-12">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('home')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="কোর্স, অধ্যায়, প্রশ্ন খুঁজুন..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-10 h-11 text-base bg-muted/30 border-border/50 focus:border-emerald-400"
                autoFocus
                aria-label="সার্চ করুন"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              খুঁজুন
            </Button>
          </div>

          {/* Type Filter Pills */}
          {searched && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {typeFilters.map((filter) => {
                const Icon = filter.icon
                const count = filter.key === 'all'
                  ? total
                  : filter.key === 'mcq' ? mcqCount
                  : filter.key === 'cq' ? cqCount
                  : filter.key === 'lecture' ? lectureCount
                  : filter.key === 'suggestion' ? suggestionCount
                  : filter.key === 'notice' ? noticeCount
                  : filter.key === 'bundle' ? bundleCount
                  : 0

                return (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeFilter === filter.key
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {filter.label}
                    {count > 0 && (
                      <span className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-muted-foreground">খুঁজছি...</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 mb-4">
              <Search className="h-12 w-12 text-emerald-600/50" />
            </div>
            <h2 className="text-xl font-bold mb-2">কন্টেন্ট খুঁজুন</h2>
            <p className="text-muted-foreground text-center max-w-sm">
              লেকচার, MCQ, সৃজনশীল প্রশ্ন, সাজেশন, নোটিশ এবং বান্ডেল খুঁজতে উপরে কিছু লিখুন
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {(config?.searchSuggestions && config.searchSuggestions.length > 0 
                ? config.searchSuggestions 
                : ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'বাংলা', 'ইংরেজি']
              ).map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); performSearch(term, 'all') }}
                  className="px-3 py-1.5 rounded-full text-sm bg-muted/50 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && searched && total === 0 && (
          <div className="flex flex-col items-center justify-center py-20" role="alert">
            <div className="p-6 rounded-2xl bg-muted/30 mb-4">
              <Search className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">কিছু পাওয়া যায়নি</h2>
            <p className="text-muted-foreground text-center">
              &quot;{query}&quot; এর জন্য কোনো কন্টেন্ট পাওয়া যায়নি। অন্য কিছু দিয়ে খুঁজে দেখুন।
            </p>
          </div>
        )}

        {/* Results List */}
        {!loading && searched && total > 0 && (
          <div className="space-y-6" aria-live="polite" role="region" aria-label="সার্চ ফলাফল">
            <p className="text-sm text-muted-foreground">
              &quot;{query}&quot; এর জন্য <span className="font-semibold text-foreground">{total}</span>টি ফলাফল পাওয়া গেছে
            </p>

            {/* Lectures */}
            {results.lectures && results.lectures.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  লেকচার
                  <Badge variant="secondary" className="text-xs">{lectureCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.lectures.map((lecture) => (
                    <Card key={lecture.id} className="cursor-pointer hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all border-border/50" onClick={() => goToLecture(lecture)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{lecture.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {lecture.chapter?.subject?.class && <Badge variant="outline" className="text-[10px] h-5">{classLabelMap[lecture.chapter.subject.class.slug] || lecture.chapter.subject.class.name}</Badge>}
                              {lecture.chapter?.subject && <Badge variant="outline" className="text-[10px] h-5">{lecture.chapter.subject.name}</Badge>}
                              {lecture.chapter && <Badge variant="outline" className="text-[10px] h-5">{lecture.chapter.name}</Badge>}
                              {lecture.duration > 0 && <span className="text-[10px] text-muted-foreground">{lecture.duration} মিনিট</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {lecture.isPremium && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1 text-[10px]"><Crown className="h-3 w-3" /> ৳{lecture.price}</Badge>}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* MCQs */}
            {results.mcqs && results.mcqs.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                  MCQ
                  <Badge variant="secondary" className="text-xs">{mcqCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.mcqs.map((mcq) => (
                    <Card key={mcq.id} className="cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all border-border/50" onClick={() => goToMCQ(mcq)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                            <FileQuestion className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <RichContentRenderer content={mcq.question} className="font-semibold text-sm line-clamp-2" inline />
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {mcq.chapter?.subject?.class && <Badge variant="outline" className="text-[10px] h-5">{classLabelMap[mcq.chapter.subject.class.slug] || mcq.chapter.subject.class.name}</Badge>}
                              {mcq.chapter?.subject && <Badge variant="outline" className="text-[10px] h-5">{mcq.chapter.subject.name}</Badge>}
                              <Badge className={`text-[10px] h-5 ${difficultyColors[mcq.difficulty] || ''}`}>{difficultyLabels[mcq.difficulty] || mcq.difficulty}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {mcq.isPremium && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1 text-[10px]"><Crown className="h-3 w-3" /> ৳{mcq.price}</Badge>}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* CQs */}
            {results.cqs && results.cqs.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  সৃজনশীল প্রশ্ন
                  <Badge variant="secondary" className="text-xs">{cqCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.cqs.map((cq) => (
                    <Card key={cq.id} className="cursor-pointer hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all border-border/50" onClick={() => goToCQ(cq)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <RichContentRenderer content={cq.uddeepok} className="font-semibold text-sm line-clamp-2" inline />
                            {cq.uddeepokImage && (
                              <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {cq.chapter?.subject?.class && <Badge variant="outline" className="text-[10px] h-5">{classLabelMap[cq.chapter.subject.class.slug] || cq.chapter.subject.class.name}</Badge>}
                              {cq.chapter?.subject && <Badge variant="outline" className="text-[10px] h-5">{cq.chapter.subject.name}</Badge>}
                              <Badge className={`text-[10px] h-5 ${difficultyColors[cq.difficulty] || ''}`}>{difficultyLabels[cq.difficulty] || cq.difficulty}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {cq.isPremium && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1 text-[10px]"><Crown className="h-3 w-3" /> ৳{cq.price}</Badge>}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Suggestions */}
            {results.suggestions && results.suggestions.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                  সাজেশন
                  <Badge variant="secondary" className="text-xs">{suggestionCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="cursor-pointer hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all border-border/50" onClick={() => goToSuggestion(suggestion)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                            <Lightbulb className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{suggestion.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {suggestion.isPremium && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1 text-[10px]"><Crown className="h-3 w-3" /> ৳{suggestion.price}</Badge>}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Notices */}
            {results.notices && results.notices.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <Megaphone className="h-5 w-5 text-cyan-600" />
                  নোটিশ
                  <Badge variant="secondary" className="text-xs">{noticeCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.notices.map((notice) => (
                    <Card key={notice.id} className="cursor-pointer hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-800 transition-all border-border/50" onClick={() => goToNotice(notice)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center shrink-0">
                            <Megaphone className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{notice.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-5">{notice.type === 'pdf' ? 'PDF' : notice.type === 'link' ? 'লিংক' : 'টেক্সট'}</Badge>
                              {notice.isPinned && <Badge className="bg-red-100 text-red-700 text-[10px] h-5">পিন করা</Badge>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Bundles */}
            {results.bundles && results.bundles.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <Package className="h-5 w-5 text-rose-600" />
                  বান্ডেল
                  <Badge variant="secondary" className="text-xs">{bundleCount}</Badge>
                </h3>
                <div className="space-y-2">
                  {results.bundles.map((bundle) => (
                    <Card key={bundle.id} className="cursor-pointer hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800 transition-all border-border/50" onClick={() => goToBundle(bundle)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-rose-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{bundle.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">৳{bundle.price}</p>
                              {bundle.originalPrice > bundle.price && <p className="text-[10px] text-muted-foreground line-through">৳{bundle.originalPrice}</p>}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
