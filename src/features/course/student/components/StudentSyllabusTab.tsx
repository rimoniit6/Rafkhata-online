'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Table2, Clock, BookOpen, FileQuestion, AlignLeft, StickyNote, Radio, Video, User, CheckCircle2, Circle, Lock, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SyllabusRow, SyllabusSummary } from '@/features/course/types'

interface Props {
  courseId: string
  rows: SyllabusRow[]
  summary: SyllabusSummary | null
  loading: boolean
  hasAccess: boolean
  progress: Record<string, boolean>
  onToggleProgress: (contentId: string, completed: boolean) => void
  onLoad: () => void
}

const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

const TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  LIVE: { label: 'লাইভ ক্লাস', variant: 'default' },
  RECORDED: { label: 'রেকর্ডেড ক্লাস', variant: 'secondary' },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'সব' },
  { value: 'LIVE', label: 'লাইভ ক্লাস' },
  { value: 'RECORDED', label: 'রেকর্ডেড ক্লাস' },
]

export default function StudentSyllabusTab({ rows, summary, loading, hasAccess, progress, onToggleProgress, onLoad, courseId }: Props) {
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (courseId && rows.length === 0 && !loading) onLoad()
  }, [courseId])

  const sorted = [...rows].sort((a, b) => {
    if ((a.dayOfWeek ?? 99) !== (b.dayOfWeek ?? 99)) return (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99)
    if ((a.startTime ?? '99:99') !== (b.startTime ?? '99:99')) return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')
    return a.displayOrder - b.displayOrder
  })

  const displayed = filter === 'all' ? sorted : sorted.filter(r => r.lessonType === filter)

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
      <StudentSummaryCards summary={summary} />

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ফিল্টার" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{displayed.length}টি আইটেম</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">তারিখ</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">বিষয়</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">ধরন</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">স্ট্যাটাস</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                      <Table2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p>কোনো সিলেবাস আইটেম নেই</p>
                    </td>
                  </tr>
                ) : (
                  displayed.map((row, idx) => {
                    const isCompleted = progress[row.contentId] || false
                    const isLocked = !hasAccess

                    return (
                      <motion.tr
                        key={row.contentId}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`border-b last:border-0 hover:bg-muted/30 ${isCompleted ? 'bg-green-50/50' : ''} ${isLocked ? 'opacity-60' : ''}`}
                      >
                        <td className="px-2 py-2.5 text-center">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <StudentScheduleDisplay row={row} />
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2.5 font-medium">{row.title || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Badge variant={TYPE_BADGE[row.lessonType]?.variant || 'outline'} className="text-[10px]">
                            {TYPE_BADGE[row.lessonType]?.label || row.lessonType}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isCompleted ? (
                            <Badge className="bg-green-100 text-green-700 text-[10px]">সম্পন্ন</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">শুরু হয়নি</Badge>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {isLocked ? (
                            <Lock className="mx-auto h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onToggleProgress(row.contentId, !isCompleted)}
                            >
                              {isCompleted ? <Eye className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentSummaryCards({ summary }: { summary: SyllabusSummary | null }) {
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

function StudentScheduleDisplay({ row }: { row: SyllabusRow }) {
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
