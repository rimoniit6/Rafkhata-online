'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/shared/EmptyState'
import { useRouterStore } from '@/store/router'
import { useIsAuthenticated } from '@/store/auth'
import { toBengaliNumerals } from '@/lib/utils'
import {
  BookOpen, Calendar, Clock, FileQuestion, Sparkles, Trophy,
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
  createdAt: string
}

export default function CustomExamHistory() {
  const navigate = useRouterStore((s) => s.navigate)
  const isAuthenticated = useIsAuthenticated()

  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  const fetchExams = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', String(pageSize))
      const res = await fetch(`/api/exams/my-exams?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) setExams(json.data || [])
    } catch {
      setExams([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchRef = useRef(fetchExams)
  useEffect(() => { fetchRef.current = fetchExams }, [fetchExams])
  useEffect(() => { fetchRef.current() }, [isAuthenticated])

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return d }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-4"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="কোনো কাস্টম পরীক্ষা নেই"
        description="আপনি এখনো কোনো কাস্টম পরীক্ষা তৈরি করেননি। নতুন পরীক্ষা তৈরি করতে নিচের বাটনে ক্লিক করুন।"
        actionLabel="পরীক্ষা তৈরি করুন"
        onAction={() => navigate('create-exam')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {exams.slice(0, 10).map((exam) => (
        <Card key={exam.id} className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Sparkles className="size-3" />
                    কাস্টম
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    <Sparkles className="size-3" />
                    কাস্টম
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
                <p className="text-lg font-bold text-emerald-600">{toBengaliNumerals(exam.totalMarks)}</p>
                <p className="text-[10px] text-muted-foreground">নম্বর</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('exam-session', { examId: exam.id, source: 'custom' })}>
                <BookOpen className="size-3" />
                পরীক্ষা দিন
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {exams.length > 10 && (
        <div className="text-center pt-2">
          <Button variant="link" size="sm" onClick={() => navigate('exam-creator-history')}>
            সকল {toBengaliNumerals(exams.length)}টি পরীক্ষা দেখুন
          </Button>
        </div>
      )}
    </div>
  )
}
