'use client'

import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  ChevronLeft, ChevronRight, Plus, X,
  Radio, Video, Link, Clock, StickyNote, Paperclip, Check,
  BookOpen, Monitor, Calendar, Library, Sparkles,
} from 'lucide-react'
import type { CourseLessonRecord } from '@/features/course/types'

const STEPS = [
  { id: 'basic', label: 'মৌলিক তথ্য', icon: BookOpen, desc: 'পাঠের শিরোনাম ও ধরন নির্ধারণ করুন' },
  { id: 'setup', label: 'ক্লাস সেটআপ', icon: Monitor, desc: 'লাইভ বা রেকর্ডেড ক্লাসের বিবরণ দিন' },
  { id: 'schedule', label: 'সময়সূচী', icon: Calendar, desc: 'পাঠের তারিখ ও সময় নির্ধারণ করুন' },
  { id: 'resources', label: 'নোট ও রিসোর্স', icon: Library, desc: 'নোট ও রিসোর্স যুক্ত করুন' },
] as const

interface LessonEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  lesson?: CourseLessonRecord
  courseId: string
  onCreate: (data: Record<string, unknown>) => Promise<string | undefined>
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onAddNote: (data: Record<string, unknown>) => Promise<void>
  onRemoveNote: (id: string) => Promise<void>
  onAddResource: (data: Record<string, unknown>) => Promise<void>
  onRemoveResource: (id: string) => Promise<void>
  onSetSchedule: (lessonId: string, date?: string, startTime?: string, endTime?: string) => Promise<void>
  onRemoveSchedule: (lessonId: string) => Promise<void>
}

export default function LessonEditorSheet({
  open, onOpenChange, mode, lesson: editLesson, courseId,
  onCreate, onUpdate,
  onAddNote, onRemoveNote,
  onAddResource, onRemoveResource,
  onSetSchedule, onRemoveSchedule,
}: LessonEditorSheetProps) {
  const [step, setStep] = useState(0)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lessonType, setLessonType] = useState<'LIVE' | 'RECORDED'>('LIVE')

  const [meetingLink, setMeetingLink] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [platform, setPlatform] = useState('')
  const [password, setPassword] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [previewVideo, setPreviewVideo] = useState('')
  const [duration, setDuration] = useState('')

  const [scheduleDate, setScheduleDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [noteTitle, setNoteTitle] = useState('')
  const [noteType, setNoteType] = useState('link')
  const [noteContent, setNoteContent] = useState('')
  const [noteFileUrl, setNoteFileUrl] = useState('')
  const [noteLink, setNoteLink] = useState('')
  const [resTitle, setResTitle] = useState('')
  const [resType, setResType] = useState('link')
  const [resFileUrl, setResFileUrl] = useState('')
  const [resLink, setResLink] = useState('')

  useEffect(() => {
    if (!open) { setStep(0); setLessonId(null); setError(null); return }
    if (mode === 'edit' && editLesson) {
      setLessonId(editLesson.id)
      setTitle(editLesson.title)
      setDescription(editLesson.description || '')
      setLessonType(editLesson.lessonType as 'LIVE' | 'RECORDED')
      setMeetingLink(editLesson.meetingLink || '')
      setMeetingId(editLesson.meetingId || '')
      setPlatform(editLesson.platform || '')
      setPassword(editLesson.password || '')
      setVideoUrl(editLesson.videoUrl || '')
      setPreviewVideo(editLesson.previewVideo || '')
      setDuration(editLesson.duration?.toString() || '')
      setScheduleDate(editLesson.schedules?.[0]?.date?.slice(0, 10) || '')
      setStartTime(editLesson.schedules?.[0]?.startTime || '')
      setEndTime(editLesson.schedules?.[0]?.endTime || '')
    } else {
      setLessonId(null)
      setTitle(''); setDescription(''); setLessonType('LIVE')
      setMeetingLink(''); setMeetingId(''); setPlatform(''); setPassword('')
      setVideoUrl(''); setPreviewVideo(''); setDuration('')
      setScheduleDate(''); setStartTime(''); setEndTime('')
    }
  }, [open, mode, editLesson])

  const handleNext = () => {
    setError(null)
    if (step === 0) {
      if (!title.trim()) return
      const payload = { title: title.trim(), description: description || null, lessonType }
      if (mode === 'create' && !lessonId) {
        onCreate(payload).then(id => { if (id) setLessonId(id) })
      } else {
        const id = lessonId || editLesson?.id
        if (id) onUpdate(id, payload)
      }
      setStep(1)
      return
    }
    if (step < STEPS.length - 1) setStep(s => s + 1)
    if (step === 1 && lessonId) {
      onUpdate(lessonId, lessonType === 'LIVE'
        ? { meetingLink: meetingLink || null, meetingId: meetingId || null, platform: platform || null, password: password || null }
        : { videoUrl: videoUrl || null, previewVideo: previewVideo || null, duration: duration ? parseInt(duration) : null }
      )
    } else if (step === 2 && lessonId) {
      onSetSchedule(lessonId, scheduleDate || undefined, startTime || undefined, endTime || undefined)
    }
  }

  const handlePrev = () => { if (step > 0) setStep(s => s - 1) }
  const handleClose = () => { onOpenChange(false) }

  const canProceed = () => step > 0 || title.trim().length > 0

  const s = STEPS[step]
  const StepIcon = s.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {mode === 'create' ? 'নতুন পাঠ তৈরি' : 'পাঠ সম্পাদনা'}
            </SheetTitle>
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              ধাপ {step + 1} / {STEPS.length}
            </span>
          </div>
        </SheetHeader>

        <div className="px-6 pt-5 pb-4 shrink-0 bg-muted/20 border-b">
          <div className="flex items-start justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                    i === step
                      ? 'h-9 w-9 bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                      : i < step
                      ? 'h-8 w-8 bg-primary/80 text-primary-foreground'
                      : 'h-8 w-8 bg-muted-foreground/10 text-muted-foreground/40'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                <span className={`text-[10px] font-medium text-center leading-tight max-w-16 ${
                  i === step ? 'text-foreground' : 'text-muted-foreground/60'
                }`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full -mt-7 ml-9 ${i < step ? 'bg-primary/60' : 'bg-muted-foreground/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <X className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0" onClick={() => setError(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Card className="shadow-sm border-t-2 border-t-primary/20">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/[0.03] to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                  <StepIcon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm">{s.label}</CardTitle>
                  <CardDescription className="text-xs">{s.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {step === 0 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">শিরোনাম <span className="text-destructive">*</span></Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="যেমন: বীজগণিতের পরিচিতি" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">পাঠের ধরন</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setLessonType('LIVE')}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3.5 transition-all ${
                          lessonType === 'LIVE'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-muted-foreground/20'
                        }`}
                      >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          lessonType === 'LIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Radio className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">লাইভ ক্লাস</p>
                          <p className="text-[11px] text-muted-foreground">রিয়েল-টাইম মিটিং</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setLessonType('RECORDED')}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3.5 transition-all ${
                          lessonType === 'RECORDED'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-muted-foreground/20'
                        }`}
                      >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          lessonType === 'RECORDED' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Video className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">রেকর্ডেড ক্লাস</p>
                          <p className="text-[11px] text-muted-foreground">প্রি-রেকর্ডেড ভিডিও</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">বিবরণ</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="পাঠ সম্পর্কে বিস্তারিত লিখুন (ঐচ্ছিক)" rows={3} className="resize-none" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  {lessonType === 'LIVE' ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
                        <Radio className="h-3.5 w-3.5 shrink-0" />
                        লাইভ ক্লাসের জন্য মিটিং তথ্য দিন
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                          <Label className="text-sm font-medium">মিটিং লিংক</Label>
                          <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">মিটিং ID</Label>
                          <Input value={meetingId} onChange={e => setMeetingId(e.target.value)} placeholder="meeting-id" className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">প্ল্যাটফর্ম</Label>
                          <Input value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Google Meet, Zoom..." className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">পাসওয়ার্ড</Label>
                          <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="পাসওয়ার্ড (ঐচ্ছিক)" className="h-10" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs">
                        <Video className="h-3.5 w-3.5 shrink-0" />
                        রেকর্ডেড ক্লাসের জন্য ভিডিও তথ্য দিন
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2 space-y-2">
                          <Label className="text-sm font-medium">ভিডিও URL</Label>
                          <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">প্রিভিউ ভিডিও</Label>
                          <Input value={previewVideo} onChange={e => setPreviewVideo(e.target.value)} placeholder="https://youtube.com/..." className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">মেয়াদ (মিনিট)</Label>
                          <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="৩০" className="h-10" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    পাঠের তারিখ ও সময় নির্ধারণ করুন (ঐচ্ছিক)
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">তারিখ</Label>
                      <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">শুরুর সময়</Label>
                      <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">শেষের সময়</Label>
                      <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-10" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 text-xs">
                    <Library className="h-3.5 w-3.5 shrink-0" />
                    পাঠের জন্য নোট ও রিসোর্স সংযুক্ত করুন
                  </div>

                  <div className="rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <StickyNote className="h-5 w-5 text-blue-500" />
                      <h4 className="text-sm font-semibold">নোট</h4>
                    </div>
                    {mode === 'edit' && editLesson && (editLesson.notes || []).length > 0 && (
                      <div className="space-y-1.5">
                        {(editLesson.notes || []).map(n => (
                          <div key={n.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-background border px-3.5 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{n.title}</p>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{n.type}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveNote(n.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="নোটের শিরোনাম" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} className="h-9 text-sm" />
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">লিংক</SelectItem>
                          <SelectItem value="richtext">রিচ টেক্সট</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {noteType === 'link' && (
                      <Input placeholder="https://..." value={noteLink} onChange={e => setNoteLink(e.target.value)} className="h-9 text-sm" />
                    )}
                    {noteType === 'pdf' && (
                      <Input placeholder="https://example.com/file.pdf" value={noteFileUrl} onChange={e => setNoteFileUrl(e.target.value)} className="h-9 text-sm" />
                    )}
                    {noteType === 'richtext' && (
                      <Textarea placeholder="HTML কন্টেন্ট লিখুন..." value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={2} className="resize-none text-sm" />
                    )}
                    <div className="flex justify-end">
                      <Button size="sm" disabled={!noteTitle.trim() || !lessonId} onClick={async () => {
                        if (!noteTitle.trim() || !lessonId) return
                        await onAddNote({ lessonId, title: noteTitle.trim(), type: noteType, content: noteContent || null, fileUrl: noteFileUrl || null, link: noteLink || null })
                        setNoteTitle(''); setNoteContent(''); setNoteFileUrl(''); setNoteLink('')
                      }}>
                        <Plus className="h-3.5 w-3.5 mr-1" />যুক্ত করুন
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-emerald-50/30 dark:bg-emerald-950/10 p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="h-5 w-5 text-emerald-500" />
                      <h4 className="text-sm font-semibold">রিসোর্স</h4>
                    </div>
                    {mode === 'edit' && editLesson && (editLesson.resources || []).length > 0 && (
                      <div className="space-y-1.5">
                        {(editLesson.resources || []).map(r => (
                          <div key={r.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-background border px-3.5 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{r.title}</p>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{r.type}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveResource(r.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="রিসোর্সের শিরোনাম" value={resTitle} onChange={e => setResTitle(e.target.value)} className="h-9 text-sm" />
                      <Select value={resType} onValueChange={setResType}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">লিংক</SelectItem>
                          <SelectItem value="file">ফাইল</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder={resType === 'link' ? 'https://...' : 'https://example.com/file.pdf'} value={resType === 'link' ? resLink : resFileUrl} onChange={e => resType === 'link' ? setResLink(e.target.value) : setResFileUrl(e.target.value)} className="h-9 text-sm" />
                    <div className="flex justify-end">
                      <Button size="sm" disabled={!resTitle.trim() || !lessonId} onClick={async () => {
                        if (!resTitle.trim() || !lessonId) return
                        await onAddResource({ lessonId, title: resTitle.trim(), type: resType, fileUrl: resFileUrl || null, link: resLink || null })
                        setResTitle(''); setResFileUrl(''); setResLink('')
                      }}>
                        <Plus className="h-3.5 w-3.5 mr-1" />যুক্ত করুন
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="border-t bg-muted/10 px-6 py-4 flex items-center justify-between shrink-0">
          {step > 0 ? (
            <Button variant="outline" onClick={handlePrev} className="h-10">
              <ChevronLeft className="h-4 w-4 mr-1.5" />পূর্ববর্তী
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose} className="h-10 text-muted-foreground">
              <X className="h-4 w-4 mr-1.5" />বাতিল
            </Button>
          )}
          {step === STEPS.length - 1 ? (
            <Button onClick={handleClose} className="h-10 px-6">
              <Check className="h-4 w-4 mr-1.5" />সম্পন্ন
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} className="h-10 px-6">
              পরবর্তী
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


