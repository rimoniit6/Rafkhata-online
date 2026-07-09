'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Radio, Video, FileQuestion, StickyNote, CheckCircle2 } from 'lucide-react'

interface CourseRoutineSlotRecord {
  id: string; routineId: string; startTime: string; endTime: string;
  title: string; type: string; description: string | null; color: string | null;
  displayOrder: number; contentId: string | null
}

interface CourseRoutineRecord {
  id: string; courseId: string; dayOfWeek: number; label: string | null
  displayOrder: number; slots: CourseRoutineSlotRecord[]
}

interface Props {
  routines: CourseRoutineRecord[]
  progress?: Record<string, boolean>
}

const DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']

const SLOT_TYPE_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LIVE_CLASS: { label: 'লাইভ ক্লাস', icon: Radio, color: 'text-blue-600 bg-blue-100' },
  RECORDING: { label: 'রেকর্ডিং', icon: Video, color: 'text-purple-600 bg-purple-100' },
  EXAM: { label: 'পরীক্ষা', icon: FileQuestion, color: 'text-amber-600 bg-amber-100' },
  NOTE: { label: 'নোট', icon: StickyNote, color: 'text-green-600 bg-green-100' },
}

export default function StudentRoutineTab({ routines, progress = {} }: Props) {
  const sorted = [...routines].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.displayOrder - b.displayOrder)
  const hasRoutines = sorted.length > 0 && sorted.some(r => r.slots.length > 0)

  if (!hasRoutines) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">কোনো রুটিন নেই</p>
        <p className="text-sm text-muted-foreground">রুটিন শীঘ্রই যোগ করা হবে</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.filter(r => r.slots.length > 0).map(r => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <h4 className="mb-2 font-semibold text-primary">{DAYS[r.dayOfWeek] || `Day ${r.dayOfWeek}`}</h4>
            {r.label && <p className="mb-2 text-xs text-muted-foreground">{r.label}</p>}
            <div className="space-y-1.5">
              {r.slots.map(s => {
                const typeInfo = SLOT_TYPE_MAP[s.type] || SLOT_TYPE_MAP.LIVE_CLASS
                const Icon = typeInfo.icon
                const isCompleted = s.contentId ? progress[s.contentId] || false : false

                return (
                  <div key={s.id} className={`flex items-center gap-2 rounded-md p-2 text-xs ${isCompleted ? 'bg-green-50' : 'bg-muted/50'}`}>
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${typeInfo.color}`}>
                      {isCompleted ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Icon className="h-3 w-3" />}
                    </div>
                    <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                      {s.startTime} - {s.endTime}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{s.title}</span>
                      {s.description && <span className="text-muted-foreground"> — {s.description}</span>}
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[9px]">{typeInfo.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
