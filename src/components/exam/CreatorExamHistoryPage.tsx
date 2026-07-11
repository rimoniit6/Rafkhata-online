'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouterStore } from '@/store/router'
import { useShallowAuth } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import EmptyState from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { toBengaliNumerals, cn } from '@/lib/utils'
import {
  ArrowLeft,
  Search,
  BookOpen,
  Trophy,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  FileQuestion,
  BarChart3,
  Eye,
} from 'lucide-react'

interface ExamItem {
  id: string
  title: string
  classLevel: string
  duration: number
  totalQuestions: number
  totalMarks: number
  attempts: number
  highestScore: number
  averageScore: number
  lastAttempt: string | null
  status: string
  createdAt: string
}

export default function CreatorExamHistoryPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const { user, isAuthenticated } = useShallowAuth()
  const { toast } = useToast()

  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchExams = useCallback(async (p: number, search?: string) => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(pageSize))
      if (search) params.set('search', search)

      const res = await fetch(`/api/exams/my-exams?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) {
        setExams(json.data || [])
        setTotalPages(json.pagination?.totalPages || 1)
        setTotal(json.pagination?.total || 0)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষার তালিকা আনতে ব্যর্থ হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, toast])

  const fetchExamsRef = useRef(fetchExams)
  useEffect(() => { fetchExamsRef.current = fetchExams }, [fetchExams])

  useEffect(() => {
    fetchExamsRef.current(page, searchQuery)
  }, [page, isAuthenticated])

  const handleSearch = () => {
    setPage(1)
    fetchExams(1, searchQuery)
  }

  const handleViewResults = (examId: string) => {
    navigate('exam-result', { resultId: examId })
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return d }
  }

  const stats = useMemo(() => {
    if (exams.length === 0) return null
    const totalAttempts = exams.reduce((s, e) => s + e.attempts, 0)
    const avgScore = exams.reduce((s, e) => s + e.averageScore, 0) / exams.length
    return { totalExams: exams.length, totalAttempts, avgScore: Math.round(avgScore) }
  }, [exams])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="size-5" /></Button>
            <h1 className="text-xl font-bold">আমার পরীক্ষাসমূহ</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Card className="p-8 text-center max-w-md">
            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">লগইন করুন</p>
            <p className="text-sm text-muted-foreground mb-4">আপনার তৈরি করা পরীক্ষাগুলো দেখতে লগইন করুন</p>
            <Button onClick={() => navigate('login')}>লগইন করুন</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="size-5" /></Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="size-6 text-emerald-500" />
                আমার পরীক্ষাসমূহ
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">আপনার তৈরি করা কাস্টম পরীক্ষার তালিকা</p>
            </div>
            {!loading && total > 0 && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <FileQuestion className="size-3" />
                {toBengaliNumerals(total)}টি পরীক্ষা
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="পরীক্ষার নাম খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleSearch} className="h-9">খুঁজুন</Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="কোনো পরীক্ষা তৈরি করেননি"
            description="আপনি এখনো কোনো কাস্টম পরীক্ষা তৈরি করেননি। নতুন পরীক্ষা তৈরি করতে নিচের বাটনে ক্লিক করুন।"
            actionLabel="পরীক্ষা তৈরি করুন"
            onAction={() => navigate('create-exam')}
          />
        ) : (
          <div className="space-y-3">
            {exams.map((exam, idx) => (
              <Card key={exam.id} className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">#{toBengaliNumerals(idx + 1)}</span>
                        <Badge variant={exam.attempts > 0 ? 'default' : 'secondary'} className="text-[10px]">
                          {exam.attempts > 0 ? `${toBengaliNumerals(exam.attempts)} বার` : 'চেষ্টা করা হয়নি'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-1">{exam.title}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileQuestion className="size-3" />
                          {toBengaliNumerals(exam.totalQuestions)}টি প্রশ্ন
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {toBengaliNumerals(exam.duration)} মিনিট
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(exam.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {exam.attempts > 0 ? (
                        <>
                          <p className="text-lg font-bold text-emerald-600">{toBengaliNumerals(exam.highestScore)}%</p>
                          <p className="text-[10px] text-muted-foreground">সর্বোচ্চ</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>

                  {exam.attempts > 0 && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="size-3 text-violet-500" />
                        গড়: {toBengaliNumerals(exam.averageScore)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3 text-blue-500" />
                        মোট: {toBengaliNumerals(exam.attempts)} বার
                      </span>
                      {exam.lastAttempt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-amber-500" />
                          সর্বশেষ: {formatDate(exam.lastAttempt)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleViewResults(exam.id)}>
                      <Eye className="size-3" />
                      ফলাফল দেখুন
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => navigate('exam-session', { examId: exam.id })}>
                      <BookOpen className="size-3" />
                      পুনরায় চেষ্টা
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              আগের
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {toBengaliNumerals(page)} / {toBengaliNumerals(totalPages)}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              পরের
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
