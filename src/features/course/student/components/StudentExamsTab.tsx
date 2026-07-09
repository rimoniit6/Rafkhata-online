'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileQuestion, AlignLeft, Clock, Lock, Play,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SyllabusRow } from '@/features/course/types'
import { useRouterStore } from '@/store/router'

interface ExamEntry {
  type: 'MCQ' | 'CQ'
  packageId: string
  packageName: string | null
  setId: string
  setTitle: string
  setDate: string | null
  setStartTime: string | null
  setEndTime: string | null
}

interface CalendarEntry {
  type: 'MCQ' | 'CQ'
  packageId: string
  packageName: string | null
  setId: string
  setTitle: string
  setDate: string | null
  setStartTime: string | null
  setEndTime: string | null
}

interface Props {
  rows: SyllabusRow[]
  examCalendar?: CalendarEntry[]
  hasAccess: boolean
}

const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

function formatExamDate(dateStr: string | null, startTime: string | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const dayName = DAYS[date.getDay()]
    const formatted = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
    return startTime ? `${formatted} (${dayName}), ${startTime}` : `${formatted} (${dayName})`
  } catch {
    return dateStr
  }
}

export default function StudentExamsTab({ rows, examCalendar = [], hasAccess }: Props) {
  const { navigate } = useRouterStore()
  const [liveNow, setLiveNow] = useState<Set<string>>(new Set())
  const [upcomingSet, setUpcomingSet] = useState<Set<string>>(new Set())

  const entries = useMemo(() => {
    const seen = new Set<string>()
    const result: ExamEntry[] = []

    for (const e of examCalendar) {
      const key = `${e.type}-${e.setId || e.packageId}-${e.setDate || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({
          type: e.type,
          packageId: e.packageId,
          packageName: e.packageName,
          setId: e.setId || '',
          setTitle: e.setTitle || '',
          setDate: e.setDate || null,
          setStartTime: e.setStartTime || null,
          setEndTime: e.setEndTime || null,
        })
      }
    }

    for (const row of rows) {
      for (const e of row.mcqExams) {
        const key = `MCQ-${e.packageId}-${e.setDate || ''}`
        if (!seen.has(key)) {
          seen.add(key)
          result.push({ type: 'MCQ', ...e })
        }
      }
      for (const e of row.cqExams) {
        const key = `CQ-${e.packageId}-${e.setDate || ''}`
        if (!seen.has(key)) {
          seen.add(key)
          result.push({ type: 'CQ', ...e })
        }
      }
    }

    return result
  }, [rows, examCalendar])

  useEffect(() => {
    function updateTimestamps() {
      const bdOffset = 6 * 60
      const now = new Date()
      const bdNow = new Date(now.getTime() + bdOffset * 60 * 1000)
      const todayStr = bdNow.toISOString().split('T')[0]
      const currentMinutes = bdNow.getUTCHours() * 60 + bdNow.getUTCMinutes()
      const live = new Set<string>()
      const upcoming = new Set<string>()
      for (const e of entries) {
        if (!e.setDate) continue
        const itemDate = e.setDate.split('T')[0]
        const isUpcoming = new Date(e.setDate) > bdNow
        if (isUpcoming) upcoming.add(`${e.type}-${e.setId}`)
        if (!e.setStartTime) continue
        if (itemDate !== todayStr) continue
        const [sh, sm] = e.setStartTime.split(':').map(Number)
        const startMinutes = sh * 60 + sm
        let endMinutes = startMinutes + 60
        if (e.setEndTime) {
          const [eh, em] = e.setEndTime.split(':').map(Number)
          endMinutes = eh * 60 + em
        }
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          live.add(`${e.type}-${e.setId}`)
        }
      }
      setLiveNow(live)
      setUpcomingSet(upcoming)
    }
    updateTimestamps()
    const interval = setInterval(updateTimestamps, 60000)
    return () => clearInterval(interval)
  }, [entries])

  const handleStart = (entry: ExamEntry) => {
    if (!hasAccess) return
    if (entry.setId) {
      // Direct-start with specific set
      if (entry.type === 'MCQ') {
        navigate('mcq-exam-package-detail', { packageId: entry.packageId, startSetId: entry.setId })
      } else {
        navigate('cq-exam-viewer', { packageId: entry.packageId, examId: entry.setId })
      }
    } else {
      // No specific set matched — go to package detail page
      if (entry.type === 'MCQ') {
        navigate('mcq-exam-package-detail', { packageId: entry.packageId })
      } else {
        navigate('cq-exam-package-detail', { packageId: entry.packageId })
      }
    }
  }

  if (entries.length === 0) return null

  return (
    <div className="space-y-4">
      {/* MCQ Exams */}
      {entries.filter(e => e.type === 'MCQ').length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3">
            <FileQuestion className="h-4 w-4" />MCQ পরীক্ষা
          </h3>
          <div className="space-y-2">
            {entries.filter(e => e.type === 'MCQ').map((entry, idx) => (
              <ExamCard key={`mcq-${entry.setId}`} entry={entry} idx={idx} hasAccess={hasAccess} onStart={handleStart} isLiveNow={liveNow.has(`MCQ-${entry.setId}`)} isUpcoming={upcomingSet.has(`MCQ-${entry.setId}`)} />
            ))}
          </div>
        </div>
      )}

      {/* CQ Exams */}
      {entries.filter(e => e.type === 'CQ').length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3">
            <AlignLeft className="h-4 w-4" />CQ পরীক্ষা
          </h3>
          <div className="space-y-2">
            {entries.filter(e => e.type === 'CQ').map((entry, idx) => (
              <ExamCard key={`cq-${entry.setId}`} entry={entry} idx={idx} hasAccess={hasAccess} onStart={handleStart} isLiveNow={liveNow.has(`CQ-${entry.setId}`)} isUpcoming={upcomingSet.has(`CQ-${entry.setId}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ExamCard({ entry, idx, hasAccess, onStart, isLiveNow, isUpcoming }: { entry: ExamEntry; idx: number; hasAccess: boolean; onStart: (entry: ExamEntry) => void; isLiveNow: boolean; isUpcoming: boolean }) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
    >
      <Card className={`transition-all ${isLiveNow ? 'border-red-300 ring-1 ring-red-200' : 'hover:border-primary/30'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isLiveNow ? 'bg-red-100 text-red-600 animate-pulse'
                  : entry.type === 'MCQ' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
              }`}>
                {isLiveNow ? <Play className="h-5 w-5" /> : entry.type === 'MCQ' ? <FileQuestion className="h-5 w-5" /> : <AlignLeft className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{entry.setTitle}</span>
                  {entry.packageName && (
                    <Badge variant="outline" className="text-[10px]">{entry.packageName}</Badge>
                  )}
                  {isLiveNow && (
                    <Badge className="bg-red-100 text-red-700 text-[10px] animate-pulse dark:bg-red-900/30 dark:text-red-400">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                      </span>
                      চলছে
                    </Badge>
                  )}
                </div>
                {(entry.setDate || entry.setStartTime) && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatExamDate(entry.setDate, entry.setStartTime)}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {!hasAccess ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />লকড
                </div>
              ) : isLiveNow ? (
                <Button
                  size="sm"
                  className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => onStart(entry)}
                >
                  <Play className="h-3.5 w-3.5" />এখনই শুরু করুন
                </Button>
              ) : isUpcoming ? (
                <Badge variant="secondary" className="text-xs">নির্ধারিত</Badge>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onStart(entry)}
                >
                  <Play className="h-3.5 w-3.5" />শুরু করুন
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
