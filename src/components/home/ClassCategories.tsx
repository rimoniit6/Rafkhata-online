'use client'

import {
  BookOpen, GraduationCap, Calculator, FlaskConical, Languages,
  Loader2, ArrowRight, PlayCircle, FileQuestion, ClipboardList,
  Lightbulb, Award, ChevronRight, Sparkles, AlertCircle, RefreshCw,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useClassList } from '@/hooks/use-home-data'
import { Button } from '@/components/ui/button'

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Calculator,
  FlaskConical,
  Languages,
}

// Bengali number formatter
function toBn(n: number): string {
  return n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])
}

// Color theme map by class slug — used for card backgrounds
const CLASS_THEMES: Record<string, { bg: string; cardBg: string; textAccent: string; lightBg: string }> = {
  'class-6': {
    bg: 'from-emerald-500 to-emerald-600',
    cardBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    lightBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  'class-7': {
    bg: 'from-teal-500 to-teal-600',
    cardBg: 'bg-teal-50 dark:bg-teal-950/30',
    textAccent: 'text-teal-600 dark:text-teal-400',
    lightBg: 'bg-teal-100 dark:bg-teal-900/40',
  },
  'class-8': {
    bg: 'from-cyan-500 to-cyan-600',
    cardBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    textAccent: 'text-cyan-600 dark:text-cyan-400',
    lightBg: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
  'ssc': {
    bg: 'from-amber-500 to-orange-500',
    cardBg: 'bg-amber-50 dark:bg-amber-950/30',
    textAccent: 'text-amber-600 dark:text-amber-400',
    lightBg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  'hsc': {
    bg: 'from-rose-500 to-pink-500',
    cardBg: 'bg-rose-50 dark:bg-rose-950/30',
    textAccent: 'text-rose-600 dark:text-rose-400',
    lightBg: 'bg-rose-100 dark:bg-rose-900/40',
  },
}

const defaultTheme = CLASS_THEMES['class-6']

// Quick access chips data
const QUICK_ACCESS = [
  { key: 'mcq', label: 'MCQ প্র্যাকটিস', icon: FileQuestion, route: 'mcq-practice' as const, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  { key: 'board', label: 'বোর্ড প্রশ্ন', icon: GraduationCap, route: 'board-questions' as const, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { key: 'suggestion', label: 'সাজেশন', icon: Lightbulb, route: 'notices' as const, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  { key: 'exam', label: 'পরীক্ষা সেন্টার', icon: Award, route: 'exam-center' as const, color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
]

export default function ClassCategories() {
  const { navigate } = useRouterStore()
  const { config } = useSiteConfig()
  const { data: classes = [], isLoading: loading, error: queryError } = useClassList()
  const error = queryError?.message ?? null

  return (
    <section id="class-categories" className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {config?.homepageClassesBadge || 'শিক্ষা যাত্রা'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageClassesTitle || 'আপনার ক্লাস বেছে নিন'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {config?.homepageClassesSubtitle || 'আপনার শ্রেণি অনুযায়ী সকল বিষয় ও কন্টেন্ট দেখুন'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : classes.length === 0 ? null : (
          <>
            {/* Class Cards — Horizontal snap scroll on mobile, grid on desktop */}
            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-3 md:grid-cols-5 sm:gap-5 scrollbar-none stagger-children"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {classes.map((cls) => {
                const IconComponent = iconMap[cls.icon] || BookOpen
                const theme = CLASS_THEMES[cls.slug] || defaultTheme
                const cc = cls.contentCounts

                return (
                  <div
                    key={cls.id}
                    className="snap-center min-w-[180px] sm:min-w-0 cursor-pointer group transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => navigate('class-detail', { classSlug: cls.slug })}
                  >
                    <div className={`relative bg-gradient-to-br ${theme.bg} rounded-2xl p-5 sm:p-6 text-white overflow-hidden h-full transition-shadow duration-300 group-hover:shadow-xl`}>
                      {/* Decorative circles */}
                      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-3">
                          <IconComponent className="w-6 h-6" />
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-bold mb-1">{cls.name}</h3>

                        {/* Subject count */}
                        <p className="text-white/80 text-sm mb-3">
                          {toBn(cls.subjectCount)}টি বিষয়
                        </p>

                        {/* Content mini-stats — show free count, total in lighter text */}
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="flex items-center gap-1 bg-white/15 rounded-md px-2 py-1" title={`${cc.freeLectures} ফ্রি / ${cc.lectures - cc.freeLectures} প্রিমিয়াম`}>
                            <PlayCircle className="w-3 h-3" />
                            <span>{toBn(cc.freeLectures)}<span className="text-white/40">/{toBn(cc.lectures)}</span></span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/15 rounded-md px-2 py-1" title={`${cc.freeMcqs} ফ্রি / ${cc.mcqs - cc.freeMcqs} প্রিমিয়াম`}>
                            <FileQuestion className="w-3 h-3" />
                            <span>{toBn(cc.freeMcqs)}<span className="text-white/40">/{toBn(cc.mcqs)}</span></span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/15 rounded-md px-2 py-1" title={`${cc.freeCqs} ফ্রি / ${cc.cqs - cc.freeCqs} প্রিমিয়াম`}>
                            <ClipboardList className="w-3 h-3" />
                            <span>{toBn(cc.freeCqs)}<span className="text-white/40">/{toBn(cc.cqs)}</span></span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/15 rounded-md px-2 py-1" title={`${cc.freeBoardQuestions} ফ্রি / ${cc.boardQuestions - cc.freeBoardQuestions} প্রিমিয়াম`}>
                            <GraduationCap className="w-3 h-3" />
                            <span>{toBn(cc.freeBoardQuestions)}<span className="text-white/40">/{toBn(cc.boardQuestions)}</span></span>
                          </div>
                        </div>

                        {/* Total badge */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-white/60">
                            {toBn(cls.totalContent)}+ কনটেন্ট
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Access Chips */}
            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">দ্রুত অ্যাক্সেস</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {QUICK_ACCESS.map((chip) => {
                  const ChipIcon = chip.icon
                  return (
                    <button
                      key={chip.key}
                      onClick={() => navigate(chip.route)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${chip.color} hover:shadow-md`}
                    >
                      <ChipIcon className="w-4 h-4" />
                      {chip.label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
