'use client'

import { useState, useMemo } from 'react'
import { Zap, ArrowRight, Loader2, BookOpen, Hash, GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useBoardQuestionFilters } from '@/hooks/use-home-data'

// ─── Helpers ─────────────────────────────────────────────────────────

function formatBengali(num: number): string {
  return new Intl.NumberFormat('bn-BD').format(num)
}

/** Deterministic gradient per class slug so each chip has a unique look */
const CLASS_GRADIENTS: Record<string, { active: string; light: string }> = {
  'class-6': {
    active: 'from-sky-500 to-cyan-600',
    light: 'from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40',
  },
  'class-7': {
    active: 'from-emerald-500 to-teal-600',
    light: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
  },
  'class-8': {
    active: 'from-amber-500 to-orange-600',
    light: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
  },
  'class-9': {
    active: 'from-orange-500 to-rose-600',
    light: 'from-orange-50 to-rose-50 dark:from-orange-950/40 dark:to-rose-950/40',
  },
  'class-10': {
    active: 'from-rose-500 to-pink-600',
    light: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
  },
  ssc: {
    active: 'from-rose-500 to-pink-600',
    light: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
  },
  hsc: {
    active: 'from-violet-500 to-purple-600',
    light: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
  },
  'hsc-2nd-year': {
    active: 'from-fuchsia-500 to-pink-600',
    light: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/40 dark:to-pink-950/40',
  },
  'ssc-2nd-year': {
    active: 'from-orange-500 to-rose-600',
    light: 'from-orange-50 to-rose-50 dark:from-orange-950/40 dark:to-rose-950/40',
  },
}

/** Fallback palette cycled by slug char-code hash */
const FALLBACK_PALETTE = [
  { active: 'from-rose-500 to-pink-600', light: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40' },
  { active: 'from-teal-500 to-emerald-600', light: 'from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40' },
  { active: 'from-amber-500 to-orange-600', light: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40' },
]

function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0
  return Math.abs(h)
}

function classGradient(slug: string): string {
  return CLASS_GRADIENTS[slug]?.active ?? FALLBACK_PALETTE[hashSlug(slug) % FALLBACK_PALETTE.length].active
}

function classGradientLight(slug: string): string {
  return CLASS_GRADIENTS[slug]?.light ?? FALLBACK_PALETTE[hashSlug(slug) % FALLBACK_PALETTE.length].light
}

// ─── Component ───────────────────────────────────────────────────────

export default function BoardQuestionSection() {
  const { navigate } = useRouterStore()
  const { config } = useSiteConfig()
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const { data: filterData = null, isLoading: loading } = useBoardQuestionFilters()

  // ─── Derived stats ────────────────────────────────────────────────

  const totalQuestions = useMemo(() => {
    if (!filterData) return 0
    return filterData.classLevels.reduce(
      (sum, cls) => sum + cls.mcqCount + cls.cqCount,
      0,
    )
  }, [filterData])

  const totalBoards = useMemo(() => {
    if (!filterData) return 0
    return filterData.boards.length
  }, [filterData])

  const yearRange = useMemo(() => {
    if (!filterData || filterData.years.length === 0) return ''
    const sorted = [...filterData.years].sort()
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    if (first === last) return formatBengali(Number(first))
    return `${formatBengali(Number(first))} – ${formatBengali(Number(last))}`
  }, [filterData])

  const popularSubjects = useMemo(() => {
    if (!filterData) return []
    return filterData.subjects.slice(0, 8)
  }, [filterData])

  // ─── Quick start: auto-select most popular board & latest year ────

  const handleQuickStart = () => {
    if (!selectedClass || !filterData) return
    const topBoard = filterData.boards[0]?.slug
    const latestYear = filterData.years[0]
    navigate('board-questions', {
      classLevel: selectedClass,
      boardName: topBoard,
      year: latestYear,
    })
  }

  const handleViewAll = () => {
    navigate('board-questions', {
      classLevel: selectedClass || undefined,
    })
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <section className="py-16 sm:py-20 bg-background relative overflow-hidden">
      {/* Subtle decorative blobs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-200/30 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-pink-200/25 dark:bg-pink-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Title ──────────────────────────────────────── */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageBoardTitle || 'বোর্ড প্রশ্ন সমাধান'}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            {config?.homepageBoardSubtitle || 'সকল বোর্ডের বিগত বছরের প্রশ্ন ও সমাধান অনুশীলন করুন'}
          </p>
        </div>

        {/* ── Glassmorphism Hero Card ────────────────────────────── */}
        <div className="animate-scale-in">
          <Card className="border-0 shadow-xl overflow-hidden relative">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-fuchsia-500/10 dark:from-rose-500/15 dark:via-pink-500/10 dark:to-fuchsia-500/15 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-sm pointer-events-none" />

            <CardContent className="relative z-10 p-5 sm:p-8">
              {/* ── Class Chips ──────────────────────────────────── */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-sm font-semibold text-foreground/80">
                    শ্রেণি নির্বাচন করুন
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="size-5 animate-spin text-rose-500" />
                    <span className="text-sm text-muted-foreground">লোড হচ্ছে...</span>
                  </div>
                ) : !filterData || filterData.classLevels.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    কোনো শ্রেণি পাওয়া যায়নি
                  </p>
                ) : (
                  <div
                    className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 stagger-children"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {filterData.classLevels.map((cls) => {
                      const isSelected = selectedClass === cls.slug
                      return (
                        <button
                          key={cls.slug}
                          onClick={() =>
                            setSelectedClass(isSelected ? null : cls.slug)
                          }
                          className={`
                            relative flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold
                            transition-all duration-200 cursor-pointer select-none
                            hover:scale-[1.06] active:scale-[0.95]
                            ${
                              isSelected
                                ? `bg-gradient-to-r ${classGradient(cls.slug)} text-white shadow-lg shadow-rose-500/25 dark:shadow-rose-500/15`
                                : `bg-gradient-to-br ${classGradientLight(cls.slug)} text-foreground/80 border border-border/50 hover:border-rose-300 dark:hover:border-rose-700`
                            }
                          `}
                        >
                          {cls.name}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                              <span className="text-[10px] text-rose-600 font-black">✓</span>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Dynamic Stats Row ────────────────────────────── */}
              {!loading && filterData && (
                <div className="flex flex-wrap items-center gap-2.5 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <Badge
                    variant="secondary"
                    className="bg-teal-100/80 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-0 text-xs font-semibold gap-1 px-2.5 py-1"
                  >
                    <Hash className="w-3 h-3" />
                    {formatBengali(totalQuestions)} প্রশ্ন
                  </Badge>

                  <Badge
                    variant="secondary"
                    className="bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-0 text-xs font-semibold gap-1 px-2.5 py-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    {formatBengali(totalBoards)}টি বোর্ড
                  </Badge>

                  {yearRange && (
                    <Badge
                      variant="secondary"
                      className="bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-0 text-xs font-semibold px-2.5 py-1"
                    >
                      📅 {yearRange}
                    </Badge>
                  )}
                </div>
              )}

              {/* ── Popular Subjects Preview ─────────────────────── */}
              {!loading && popularSubjects.length > 0 && (
                <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <span className="text-xs font-medium text-muted-foreground mb-2 block">
                    জনপ্রিয় বিষয়সমূহ
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSubjects.map((subj, idx) => (
                      <span
                        key={subj.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium
                          bg-white/60 dark:bg-white/10 backdrop-blur-sm
                          border border-border/30 text-foreground/70"
                        style={{ animationDelay: `${0.4 + idx * 0.04}s` }}
                      >
                        {subj.name}
                      </span>
                    ))}
                    {filterData && filterData.subjects.length > 8 && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium
                          bg-rose-100/60 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                      >
                        +{filterData.subjects.length - 8} আরও
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── CTA Buttons ──────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Quick Start */}
                <div className="transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]">
                  <Button
                    size="lg"
                    disabled={!selectedClass || loading}
                    onClick={handleQuickStart}
                    className={`
                      w-full sm:w-auto font-bold gap-2 px-6 py-5 rounded-xl
                      bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700
                      text-white shadow-lg shadow-rose-500/25 dark:shadow-rose-500/15
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                    `}
                  >
                    <Zap className="w-5 h-5" />
                    দ্রুত শুরু
                  </Button>
                </div>

                {/* View All */}
                <div className="transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]">
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={loading}
                    onClick={handleViewAll}
                    className="
                      w-full sm:w-auto font-semibold gap-2 px-6 py-5 rounded-xl
                      border-rose-300 dark:border-rose-700
                      text-rose-700 dark:text-rose-300
                      hover:bg-rose-50 dark:hover:bg-rose-950/40
                      transition-all duration-200
                    "
                  >
                    সব বোর্ড প্রশ্ন দেখুন
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
