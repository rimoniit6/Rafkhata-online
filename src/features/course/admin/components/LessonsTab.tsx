'use client'

import { useState } from 'react'
import {
  Plus, ChevronUp, ChevronDown, Copy, Trash2,
  Video, Radio, Link, Clock, FileText, StickyNote, Paperclip, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { CourseLessonRecord } from '@/features/course/types'
import LessonEditorSheet from './LessonEditorSheet'

interface Props {
  courseId: string
  lessons: CourseLessonRecord[]
  onCreate: (data: Record<string, unknown>) => Promise<string | undefined>
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (lessonIds: string[]) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  onAddNote: (data: Record<string, unknown>) => Promise<void>
  onRemoveNote: (id: string) => Promise<void>
  onAddResource: (data: Record<string, unknown>) => Promise<void>
  onRemoveResource: (id: string) => Promise<void>
  onSetSchedule: (lessonId: string, date?: string, startTime?: string, endTime?: string) => Promise<void>
  onRemoveSchedule: (lessonId: string) => Promise<void>
}

export default function LessonsTab({
  courseId, lessons, onCreate, onUpdate, onDelete, onReorder, onDuplicate,
  onAddNote, onRemoveNote, onAddResource, onRemoveResource,
  onSetSchedule, onRemoveSchedule,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<CourseLessonRecord | null>(null)

  const openCreate = () => { setEditingLesson(null); setSheetOpen(true) }

  const openEdit = (lesson: CourseLessonRecord) => { setEditingLesson(lesson); setSheetOpen(true) }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">পাঠসমূহ</h3>
            <p className="text-sm text-muted-foreground">মোট {lessons.length} টি পাঠ</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />নতুন পাঠ
          </Button>
        </div>

        <div className="space-y-3">
          {lessons.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p>কোনো পাঠ যোগ করা হয়নি</p>
              <Button variant="link" onClick={openCreate} className="mt-2">প্রথম পাঠ যোগ করুন</Button>
            </div>
          )}
          {lessons.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={i}
              total={lessons.length}
              onMoveUp={() => {
                const ids = lessons.map(l => l.id)
                if (i > 0) { [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; onReorder(ids) }
              }}
              onMoveDown={() => {
                const ids = lessons.map(l => l.id)
                if (i < ids.length - 1) { [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]]; onReorder(ids) }
              }}
              onEdit={() => openEdit(lesson)}
              onDelete={() => onDelete(lesson.id)}
              onDuplicate={() => onDuplicate(lesson.id)}
            />
          ))}
        </div>
      </div>

      <LessonEditorSheet
        open={sheetOpen}
        onOpenChange={v => { setSheetOpen(v); if (!v) setEditingLesson(null) }}
        mode={editingLesson ? 'edit' : 'create'}
        lesson={editingLesson || undefined}
        courseId={courseId}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onAddNote={onAddNote}
        onRemoveNote={onRemoveNote}
        onAddResource={onAddResource}
        onRemoveResource={onRemoveResource}
        onSetSchedule={onSetSchedule}
        onRemoveSchedule={onRemoveSchedule}
      />
    </>
  )
}

// ─── Lesson Card ──────────────────────────────────────────────────

function LessonCard({ lesson, index, total, onMoveUp, onMoveDown, onEdit, onDelete, onDuplicate }: {
  lesson: CourseLessonRecord
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
  onDuplicate: () => Promise<void>
}) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const schedule = lesson.schedules?.[0]

  return (
    <Card className="group hover:shadow-sm transition-shadow">
      <CardContent className="flex items-start gap-3 p-3">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveDown} disabled={index === total - 1}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{lesson.title}</span>
            <Badge variant={lesson.lessonType === 'LIVE' ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
              {lesson.lessonType === 'LIVE' ? 'লাইভ' : 'রেকর্ডেড'}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {schedule?.date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{new Date(schedule.date).toLocaleDateString('bn-BD')}
              </span>
            )}
            {schedule?.startTime && <span>{schedule.startTime}{schedule.endTime ? `-${schedule.endTime}` : ''}</span>}
            {lesson.lessonType === 'LIVE' && lesson.meetingLink && (
              <span className="flex items-center gap-1"><Link className="h-3 w-3" />লিংক</span>
            )}
            {lesson.lessonType === 'RECORDED' && lesson.videoUrl && (
              <span className="flex items-center gap-1"><Video className="h-3 w-3" />ভিডিও</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {(lesson.assignments || []).map((a, ai) => (
              <Badge key={a.id || ai} variant="outline" className="text-[10px] border-amber-300 text-amber-700">Assignment</Badge>
            ))}
            {(lesson.notes || []).length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600"><StickyNote className="h-3 w-3" />{(lesson.notes || []).length}</span>
            )}
            {(lesson.resources || []).length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600"><Paperclip className="h-3 w-3" />{(lesson.resources || []).length}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" />সম্পাদনা
          </Button>
          <Button variant="ghost" size="icon" onClick={onDuplicate} title="ডুপ্লিকেট"><Copy className="h-4 w-4" /></Button>
          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>পাঠ মুছবেন?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{lesson.title}" এবং এর সাথে সংযুক্ত সকল ডেটা স্থায়ীভাবে মুছে যাবে।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">মুছুন</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
