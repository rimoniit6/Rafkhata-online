'use client'

import {
Breadcrumb,BreadcrumbItem,BreadcrumbLink,BreadcrumbList,
BreadcrumbPage,BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn,toBengaliNumerals } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import { useQuery } from '@tanstack/react-query'
import {
ArrowRight,
BookOpen,
ChevronRight,
ClipboardList,
FileQuestion,
GraduationCap,
PlayCircle,
Search,
} from 'lucide-react'
import { useCallback,useMemo,useState } from 'react'

interface SubjectData {
  id: string
  name: string
  slug: string
  icon: string
  chapterCount: number
  color: string
  contentCounts: {
    lectures: number
    mcqs: number
    cqs: number
    boardQuestions: number
  }
}

interface ContentOverview {
  totalLectures: number
  totalMcqs: number
  totalCqs: number
  totalBoardQuestions: number
}

interface ClassData {
  id: string
  name: string
  slug: string
  description: string | null
  subjects: SubjectData[]
  contentOverview: ContentOverview
}

interface StatDef {
  icon: React.ElementType
  label: string
  count: number
  gradient: string
}

const CLASS_THEMES: Record<string, { gradient: string; accent: string }> = {
  'class-6': { gradient: 'from-emerald-600 via-emerald-500 to-teal-600', accent: 'text-emerald-600 dark:text-emerald-400' },
  'class-7': { gradient: 'from-teal-600 via-teal-500 to-cyan-600', accent: 'text-teal-600 dark:text-teal-400' },
  'class-8': { gradient: 'from-cyan-600 via-cyan-500 to-teal-600', accent: 'text-cyan-600 dark:text-cyan-400' },
  'ssc': { gradient: 'from-amber-600 via-orange-500 to-amber-600', accent: 'text-amber-600 dark:text-amber-400' },
  'hsc': { gradient: 'from-rose-600 via-pink-500 to-rose-600', accent: 'text-rose-600 dark:text-rose-400' },
}

export default function ClassHubPage() {
  const { params, navigate } = useRouterStore()
  const [search, setSearch] = useState('')

  const classSlug = params.classSlug

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<ClassData>({
    queryKey: ['class-detail', classSlug],
    queryFn: async () => {
      const r = await fetch(`/api/classes/${classSlug}`)
      if (!r.ok) throw new Error('Failed to load class')
      return r.json()
    },
    enabled: Boolean(classSlug),
  })

  const filteredSubjects = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.subjects
    const q = search.toLowerCase()
    return data.subjects.filter((s) => s.name.toLowerCase().includes(q))
  }, [data, search])

  const goToSubject = useCallback((subjectId: string, slug: string) => {
    navigate('subject-detail', {
      subjectId,
      subjectSlug: slug,
      classSlug: data?.slug || '',
    })
  }, [data, navigate])

  const theme = CLASS_THEMES[data?.slug || ''] || CLASS_THEMES['class-6']

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className={`h-44 sm:h-52 bg-gradient-to-br ${CLASS_THEMES['class-6'].gradient}`} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <BookOpen className="mx-auto mb-4 size-12 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Failed to load</h2>
          <p className="text-muted-foreground mb-4">{error ? 'Failed to load class' : 'Class not found'}</p>
          <Button onClick={() => navigate('home')} variant="outline">Go Home</Button>
        </Card>
      </div>
    )
  }

  const co = data.contentOverview
  const stats: StatDef[] = [
    { icon: PlayCircle, label: 'Lectures', count: co.totalLectures, gradient: 'from-blue-500 to-cyan-500' },
    { icon: FileQuestion, label: 'MCQ', count: co.totalMcqs, gradient: 'from-emerald-500 to-teal-500' },
    { icon: ClipboardList, label: 'CQ', count: co.totalCqs, gradient: 'from-violet-500 to-purple-500' },
    { icon: GraduationCap, label: 'Board Q', count: co.totalBoardQuestions, gradient: 'from-orange-500 to-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className={`relative h-44 sm:h-52 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div
            className="text-center animate-fade-in-up"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{data.name}</h1>
            {data.description && (
              <p className="text-white/80 text-sm sm:text-base mb-3 max-w-md">{data.description}</p>
            )}
            <p className="text-white/70 text-xs sm:text-sm">
              {toBengaliNumerals(data.subjects.length)} subjects &bull; Full curriculum
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up delay-200"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <Card className="border-border/50 hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-xl bg-gradient-to-br', stat.gradient, 'shadow-sm shrink-0')}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl font-bold">{toBengaliNumerals(stat.count)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-list')}>Classes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{data.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div
          className="relative animate-fade-in delay-200"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="pl-9 h-10 rounded-xl bg-background border-border/50"
          />
        </div>
      </div>

      {/* Subject grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-xl font-semibold mb-5">Subjects</h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in"
        >
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No subjects found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? `No subjects match "${search}"` : 'This class has no subjects yet.'}
              </p>
            </div>
          ) : (
            filteredSubjects.map((subject, index) => (
              <div key={subject.id} className="animate-fade-in-up" style={{ animationDelay: `${0.06 * index}s` }}>
                <Card
                  onClick={() => goToSubject(subject.id, subject.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      goToSubject(subject.id, subject.slug)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group h-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <CardContent className="p-0">
                    {/* Subject header */}
                    <div className="p-4 sm:p-5 pb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            subject.color || 'bg-emerald-500',
                            'p-2.5 rounded-xl text-white shrink-0 group-hover:scale-110 transition-transform'
                          )}
                        >
                          <BookOpen className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {toBengaliNumerals(subject.chapterCount)} chapters
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>
                    </div>

                    {/* Content counts */}
                    <div className="px-4 sm:px-5 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {subject.contentCounts.lectures > 0 && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            <PlayCircle className="h-2.5 w-2.5" />
                            {toBengaliNumerals(subject.contentCounts.lectures)} Lec
                          </span>
                        )}
                        {subject.contentCounts.mcqs > 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            <FileQuestion className="h-2.5 w-2.5" />
                            {toBengaliNumerals(subject.contentCounts.mcqs)} MCQ
                          </span>
                        )}
                        {subject.contentCounts.cqs > 0 && (
                          <span className="inline-flex items-center gap-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            <ClipboardList className="h-2.5 w-2.5" />
                            {toBengaliNumerals(subject.contentCounts.cqs)} CQ
                          </span>
                        )}
                        {subject.contentCounts.boardQuestions > 0 && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            <GraduationCap className="h-2.5 w-2.5" />
                            {toBengaliNumerals(subject.contentCounts.boardQuestions)} Board
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Explore hint */}
                    <div className="px-4 sm:px-5 pb-4">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 group-hover:text-primary/60 transition-colors">
                        Click to explore
                        <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
