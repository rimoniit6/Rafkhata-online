'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table2, Clock, BookOpen, FileQuestion, AlignLeft, StickyNote, Radio, Video, User,
  ExternalLink, Calendar, Sun, Monitor,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { SyllabusRow, SyllabusSummary, ExamCalendarEntry } from '@/features/course/types'

interface Props {
  courseId: string
}

const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

const TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  LIVE: { label: 'লাইভ ক্লাস', variant: 'default' },
  RECORDED: { label: 'রেকর্ডেড ক্লাস', variant: 'secondary' },
}

export default function SyllabusTab({ courseId }: Props) {
  const [summary, setSummary] = useState<SyllabusSummary | null>(null)
  const [rows, setRows] = useState<SyllabusRow[]>([])
  const [examCalendar, setExamCalendar] = useState<ExamCalendarEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSyllabus() }, [courseId])

  async function loadSyllabus() {
    setLoading(true)
    try {
      const result = await courseAdminService.syllabus(courseId)
      setSummary(result.summary)
      setRows(result.rows)
      setExamCalendar(result.examCalendar || [])
    } catch (err) {
      console.error('[SyllabusTab] Failed to load syllabus:', err)
    } finally { setLoading(false) }
  }

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    if ((a.dayOfWeek ?? 99) !== (b.dayOfWeek ?? 99)) return (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99)
    if ((a.startTime ?? '99:99') !== (b.startTime ?? '99:99')) return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')
    return a.displayOrder - b.displayOrder
  }), [rows])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />

      <Tabs defaultValue="combined" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="combined" className="gap-2">
            <Calendar className="h-4 w-4" />
            সময়সূচী
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            ক্লাস
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <FileQuestion className="h-4 w-4" />
            পরীক্ষা
          </TabsTrigger>
        </TabsList>

        <TabsContent value="combined">
          <CombinedTimeline lessons={sorted} exams={examCalendar} />
        </TabsContent>

        <TabsContent value="classes">
          <ClassScheduleTable lessons={sorted} />
        </TabsContent>

        <TabsContent value="exams">
          <ExamCalendarView exams={examCalendar} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCards({ summary }: { summary: SyllabusSummary | null }) {
  const cards = [
    { label: 'মোট পাঠ', value: summary?.totalLessons ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
    { label: 'MCQ', value: summary?.totalMcqExams ?? 0, icon: FileQuestion, color: 'text-amber-600 bg-amber-100' },
    { label: 'CQ', value: summary?.totalCqExams ?? 0, icon: AlignLeft, color: 'text-purple-600 bg-purple-100' },
    { label: 'নোট', value: summary?.totalNotes ?? 0, icon: StickyNote, color: 'text-green-600 bg-green-100' },
    { label: 'লাইভ', value: summary?.totalLiveClasses ?? 0, icon: Radio, color: 'text-rose-600 bg-rose-100' },
    { label: 'রেকর্ডেড', value: summary?.totalRecordedClasses ?? 0, icon: Video, color: 'text-cyan-600 bg-cyan-100' },
  ]

  return (
    <div className="space-y-3">
      {summary?.teacherName && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-4 w-4" />শিক্ষক: {summary.teacherName}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function formatTime(t?: string | null) {
  if (!t) return ''
  const parts = t.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Combined Timeline ────────────────────────────────────────────

function CombinedTimeline({ lessons, exams }: { lessons: SyllabusRow[]; exams: ExamCalendarEntry[] }) {
  const timeline = useMemo(() => {
    const items: Array<{ date: Date; type: 'lesson' | 'exam'; data: SyllabusRow | ExamCalendarEntry }> = []

    for (const lesson of lessons) {
      const d = parseDate(lesson.date)
      if (d) items.push({ date: d, type: 'lesson', data: lesson })
    }

    for (const exam of exams) {
      const d = parseDate(exam.scheduledDate)
      if (d) items.push({ date: d, type: 'exam', data: exam })
    }

    items.sort((a, b) => {
      const t = a.date.getTime() - b.date.getTime()
      if (t !== 0) return t
      const aTime = a.type === 'lesson' ? (a.data as SyllabusRow).startTime : (a.data as ExamCalendarEntry).startTime
      const bTime = b.type === 'lesson' ? (b.data as SyllabusRow).startTime : (b.data as ExamCalendarEntry).startTime
      return (aTime || '').localeCompare(bTime || '')
    })

    return items
  }, [lessons, exams])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof timeline>()
    for (const item of timeline) {
      const key = item.date.toISOString().split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [timeline])

  if (grouped.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p>কোনো সময়সূচী আইটেম নেই</p>
          <p className="text-xs">পাঠ ট্যাবে পাঠ ও পরীক্ষা যোগ করুন</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateKey, items]) => {
        const dayName = DAYS[new Date(dateKey).getDay()]
        return (
          <Card key={dateKey} className="overflow-hidden">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 text-sm font-medium border-b">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{formatDate(new Date(dateKey))}</span>
              <span className="text-muted-foreground">({dayName})</span>
              <Badge variant="outline" className="ml-auto text-[10px]">{items.length} টি</Badge>
            </div>
            <CardContent className="divide-y p-0">
              {items.map(item => (
                <div key={item.type === 'lesson' ? `lesson-${(item.data as SyllabusRow).contentId}` : `exam-${(item.data as ExamCalendarEntry).id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    item.type === 'lesson'
                      ? 'bg-blue-100 text-blue-600'
                      : (item.data as ExamCalendarEntry).type === 'MCQ'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'lesson' ? <Monitor className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'lesson' ? (
                        <>
                          <span className="text-sm font-medium truncate">{(item.data as SyllabusRow).title}</span>
                          <Badge variant={TYPE_BADGE[(item.data as SyllabusRow).lessonType]?.variant || 'outline'} className="shrink-0 text-[10px]">
                            {TYPE_BADGE[(item.data as SyllabusRow).lessonType]?.label || (item.data as SyllabusRow).lessonType}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium truncate">{(item.data as ExamCalendarEntry).setTitle || (item.data as ExamCalendarEntry).packageName || 'পরীক্ষা'}</span>
                          <Badge variant={(item.data as ExamCalendarEntry).type === 'MCQ' ? 'outline' : 'secondary'} className="shrink-0 text-[10px]">
                            {(item.data as ExamCalendarEntry).type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                            {(item.data as ExamCalendarEntry).packageName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.type === 'lesson'
                          ? `${formatTime((item.data as SyllabusRow).startTime)}-${formatTime((item.data as SyllabusRow).endTime)}`
                          : `${formatTime((item.data as ExamCalendarEntry).startTime)}-${formatTime((item.data as ExamCalendarEntry).endTime)}`}
                      </span>
                      {item.type === 'lesson' && (item.data as SyllabusRow).hasAssignments && (
                        <span className="text-[11px] text-amber-600">অ্যাসাইনমেন্ট</span>
                      )}
                    </div>
                  </div>
                  {item.type === 'exam' && (
                    <Link
                      href={(item.data as ExamCalendarEntry).type === 'MCQ' ? `/admin/mcq-exam-packages${(item.data as ExamCalendarEntry).setId ? `?setId=${(item.data as ExamCalendarEntry).setId}` : ''}` : `/admin/cq-exam-packages${(item.data as ExamCalendarEntry).setId ? `?setId=${(item.data as ExamCalendarEntry).setId}` : ''}`}
                      target="_blank"
                      className="shrink-0 flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      পরিচালনা
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Class Schedule Table ─────────────────────────────────────────

function ClassScheduleTable({ lessons }: { lessons: SyllabusRow[] }) {
  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Table2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p>কোনো ক্লাস নেই</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">তারিখ/সময়</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">পাঠ</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">ধরন</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">অ্যাসাইনমেন্ট</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(row => (
                <tr key={row.contentId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2.5"><ScheduleDisplay row={row} /></td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 font-medium">{row.title || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <Badge variant={TYPE_BADGE[row.lessonType]?.variant || 'outline'} className="text-[10px]">
                      {TYPE_BADGE[row.lessonType]?.label || row.lessonType}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                    {row.hasAssignments ? '✔' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Exam Calendar View ───────────────────────────────────────────

function ExamCalendarView({ exams }: { exams: ExamCalendarEntry[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, ExamCalendarEntry[]>()
    for (const exam of exams) {
      const d = parseDate(exam.scheduledDate)
      if (!d) continue
      const key = d.toISOString().split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(exam)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [exams])

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileQuestion className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p>কোনো পরীক্ষা নেই</p>
          <p className="text-xs">পাঠ ট্যাবে গিয়ে পাঠে MCQ/CQ প্যাকেজ যুক্ত করুন</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([dateKey, items]) => {
        const dayName = DAYS[new Date(dateKey).getDay()]
        return (
          <Card key={dateKey} className="overflow-hidden">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 text-sm font-medium border-b">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{formatDate(new Date(dateKey))}</span>
              <span className="text-muted-foreground">({dayName})</span>
              <Badge variant="outline" className="ml-auto text-[10px]">{items.length} টি</Badge>
            </div>
            <CardContent className="divide-y p-0">
              {items.map(exam => (
                <div key={exam.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    exam.type === 'MCQ' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <FileQuestion className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{exam.setTitle || exam.packageName || 'পরীক্ষা'}</span>
                      <Badge variant={exam.type === 'MCQ' ? 'outline' : 'secondary'} className="shrink-0 text-[10px]">{exam.type}</Badge>
                      <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">{exam.packageName}</span>
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(exam.startTime)}-{formatTime(exam.endTime)}
                    </p>
                  </div>
                  <Link
                    href={exam.type === 'MCQ' ? `/admin/mcq-exam-packages${exam.setId ? `?setId=${exam.setId}` : ''}` : `/admin/cq-exam-packages${exam.setId ? `?setId=${exam.setId}` : ''}`}
                    target="_blank"
                    className="shrink-0 flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    পরিচালনা
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ScheduleDisplay({ row }: { row: SyllabusRow }) {
  if (row.dayOfWeek !== null && row.dayOfWeek !== undefined && row.startTime) {
    return (
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-xs">{DAYS[row.dayOfWeek]} {row.startTime}-{row.endTime}</span>
      </span>
    )
  }
  if (row.date) {
    return <span className="text-xs text-muted-foreground">{new Date(row.date).toLocaleDateString('bn-BD')}</span>
  }
  return <span className="text-xs text-muted-foreground">—</span>
}
