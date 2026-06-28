'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Calendar, Clock, FileQuestion,
  GraduationCap, Trash2, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { CourseExamScheduleRecord } from '@/features/course/types'

interface Props {
  courseId: string
  onAddFromPackage: (data: Record<string, unknown>) => Promise<number>
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onRefresh: () => void
}

export default function ExamCalendarTab({ courseId, onAddFromPackage, onUpdate, onRemove, onRefresh }: Props) {
  const [schedules, setSchedules] = useState<CourseExamScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const result = await courseAdminService.syllabus(courseId)
      setSchedules(result.examCalendar || [])
    } catch { setSchedules([]) } finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { loadSchedules() }, [loadSchedules])

  const grouped = (schedules || []).reduce((acc, s) => {
    const key = s.examDate ? new Date(s.examDate).toISOString().split('T')[0] : 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {} as Record<string, CourseExamScheduleRecord[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">পরীক্ষার সময়সূচী</h3>
          <p className="text-sm text-muted-foreground">
            প্যাকেজ নির্বাচন করুন — তারিখ ও সময় স্বয়ংক্রিয় আসবে
          </p>
        </div>
        <AddFromPackageDialog courseId={courseId} onAddFromPackage={onAddFromPackage} onSuccess={loadSchedules} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">লোড হচ্ছে...</div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p>কোনো পরীক্ষার সময়সূচী নেই</p>
            <p className="text-xs">উপরে "প্যাকেজ থেকে যোগ" বাটনে ক্লিক করে প্যাকেজ নির্বাচন করুন</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([dateKey, items]) => (
          <Card key={dateKey} className="overflow-hidden">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 text-sm font-medium border-b">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{new Date(dateKey).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <Badge variant="outline" className="ml-auto text-[10px]">{items.length} টি</Badge>
            </div>
            <CardContent className="divide-y p-0">
              {items.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    s.examType === 'MCQ' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <FileQuestion className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{s.packageName || s.packageId.slice(0, 12)}</span>
                      <Badge variant={s.examType === 'MCQ' ? 'outline' : 'secondary'} className="shrink-0 text-[10px]">{s.examType}</Badge>
                      {s.autoFilledFromPackage && (
                        <Badge variant="outline" className="shrink-0 text-[10px] text-green-600 border-green-200">অটো</Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      {s.startTime}-{s.endTime}
                    </p>
                  </div>
                  {s.overrideAllowed && (
                    <EditExamScheduleDialog schedule={s} onUpdate={onUpdate} onSuccess={loadSchedules} />
                  )}
                  <RemoveExamScheduleDialog id={s.id} onRemove={onRemove} onSuccess={loadSchedules} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// ─── Add From Package Dialog ──────────────────────────────────────

function AddFromPackageDialog({ courseId, onAddFromPackage, onSuccess }: {
  courseId: string
  onAddFromPackage: (data: Record<string, unknown>) => Promise<number>
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [examType, setExamType] = useState<'MCQ' | 'CQ'>('MCQ')
  const [selectedPkgId, setSelectedPkgId] = useState('')
  const [selectedPkgName, setSelectedPkgName] = useState('')
  const [showPackageSearch, setShowPackageSearch] = useState(false)
  const [previewSets, setPreviewSets] = useState<Array<{ id: string; title: string; scheduledDate: string; startTime: string; endTime: string }>>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const fetchPreview = useCallback(async (pkgId: string, type: 'MCQ' | 'CQ') => {
    setLoadingPreview(true)
    try {
      const endpoint = type === 'MCQ' ? '/api/admin/mcq-exam-packages' : '/api/admin/cq-exam-packages'
      const res = await fetch(`${endpoint}?action=detail&id=${encodeURIComponent(pkgId)}`)
      const data = await res.json()
      const pkg = data.package ?? data.data?.package ?? null
      setPreviewSets(pkg?.examSets ?? data.examSets ?? [])
    } catch { setPreviewSets([]) } finally { setLoadingPreview(false) }
  }, [])

  const handlePackageSelect = (id: string, name: string) => {
    setSelectedPkgId(id)
    setSelectedPkgName(name)
    setShowPackageSearch(false)
    setResult(null)
    fetchPreview(id, examType)
  }

  const handleSave = async () => {
    if (!selectedPkgId) return
    setSaving(true)
    setResult(null)
    try {
      const count = await onAddFromPackage({ examType, packageId: selectedPkgId })
      if (count > 0) {
        setResult({ type: 'success', msg: `${count} টি পরীক্ষার সময়সূচী তৈরি হয়েছে` })
        setSelectedPkgId('')
        setSelectedPkgName('')
        setPreviewSets([])
        setTimeout(() => { setOpen(false); setResult(null); onSuccess() }, 1500)
      } else {
        setResult({ type: 'error', msg: 'কোনো পরীক্ষার সেট পাওয়া যায়নি' })
      }
    } catch {
      setResult({ type: 'error', msg: 'সমস্যা হয়েছে, আবার চেষ্টা করুন' })
    } finally { setSaving(false) }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />প্যাকেজ থেকে যোগ
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setResult(null); setPreviewSets([]) } }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              প্যাকেজ থেকে পরীক্ষা যোগ
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
            <div className="space-y-2">
              <Label>পরীক্ষার ধরন</Label>
              <Select value={examType} onValueChange={v => { setExamType(v as 'MCQ' | 'CQ'); setSelectedPkgId(''); setSelectedPkgName(''); setPreviewSets([]); setResult(null) }}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ প্যাকেজ</SelectItem>
                  <SelectItem value="CQ">CQ প্যাকেজ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>প্যাকেজ নির্বাচন</Label>
              <div className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setShowPackageSearch(true)}>
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">{selectedPkgName || 'প্যাকেজ খুঁজুন...'}</span>
              </div>
            </div>

            {loadingPreview && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                পরীক্ষার সেট লোড হচ্ছে...
              </div>
            )}

            {previewSets.length > 0 && !loadingPreview && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {previewSets.length} টি পরীক্ষার সেট পাওয়া গেছে — তারিখ ও সময় স্বয়ংক্রিয় নেওয়া হবে
                </Label>
                <div className="rounded-lg border divide-y">
                  {previewSets.map(set => (
                    <div key={set.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      <span className="truncate font-medium">{set.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(set.scheduledDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{set.startTime}-{set.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {result.msg}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-2 border-t mt-4 -mx-6 px-6">
            <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={!selectedPkgId || saving || previewSets.length === 0}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />তৈরি হচ্ছে...</>
              ) : (
                <><Plus className="h-4 w-4 mr-1.5" />{previewSets.length > 0 ? `${previewSets.length} টি যোগ করুন` : 'যুক্ত করুন'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SelectPackageDialog
        open={showPackageSearch}
        onOpenChange={setShowPackageSearch}
        examType={examType}
        onSelect={handlePackageSelect}
      />
    </>
  )
}

// ─── Select Package Dialog ────────────────────────────────────────

function SelectPackageDialog({ open, onOpenChange, examType, onSelect }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  examType: 'MCQ' | 'CQ'
  onSelect: (id: string, title: string) => void
}) {
  const [search, setSearch] = useState('')
  const [packages, setPackages] = useState<{ id: string; title: string; class?: { name: string } | null; _count?: { examSets?: number } }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchPackages = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const endpoint = examType === 'MCQ' ? '/api/admin/mcq-exam-packages' : '/api/admin/cq-exam-packages'
      const res = await fetch(`${endpoint}?action=list&search=${encodeURIComponent(q)}&limit=50`)
      const data = await res.json()
      setPackages(data.data?.packages || data.packages || [])
    } catch { setPackages([]) }
    setLoading(false)
  }, [examType])

  useEffect(() => {
    if (open) { setSearch(''); setPackages([]); fetchPackages('') }
  }, [open, fetchPackages])

  const onSearchChange = (v: string) => {
    setSearch(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPackages(v), 300)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {examType} প্যাকেজ নির্বাচন
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input placeholder="প্যাকেজ খুঁজুন..." value={search} onChange={e => onSearchChange(e.target.value)} className="pl-9 h-10" autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border p-1.5">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">লোড হচ্ছে...</p>
            ) : packages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো প্যাকেজ পাওয়া যায়নি</p>
            ) : (
              packages.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => onSelect(p.id, p.title)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.class?.name || '—'} • {p._count?.examSets ?? 0} টি সেট
                    </p>
                  </div>
                  <Button variant="default" size="sm" className="h-8 text-xs shrink-0 ml-3">নির্বাচন</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────

function EditExamScheduleDialog({ schedule, onUpdate, onSuccess }: {
  schedule: CourseExamScheduleRecord
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [examDate, setExamDate] = useState(schedule.examDate ? new Date(schedule.examDate).toISOString().split('T')[0] : '')
  const [startTime, setStartTime] = useState(schedule.startTime || '')
  const [endTime, setEndTime] = useState(schedule.endTime || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setExamDate(schedule.examDate ? new Date(schedule.examDate).toISOString().split('T')[0] : '')
      setStartTime(schedule.startTime || '')
      setEndTime(schedule.endTime || '')
    }
  }, [open, schedule])

  const handleSave = async () => {
    if (!examDate || !startTime || !endTime) return
    setSaving(true)
    try {
      await onUpdate(schedule.id, { examDate, startTime, endTime })
      setOpen(false)
      onSuccess()
    } catch { } finally { setSaving(false) }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => setOpen(true)}>
        সম্পাদনা
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              সময়সূচী সম্পাদনা
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>{schedule.packageName || schedule.packageId.slice(0, 12)}</span>
              <Badge variant="outline" className="text-[10px]">{schedule.examType}</Badge>
            </div>

            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="h-10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>শুরুর সময়</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>শেষের সময়</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={!examDate || !startTime || !endTime || saving}>
                {saving ? 'সেভ হচ্ছে...' : 'হালনাগাদ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Remove Dialog ────────────────────────────────────────────────

function RemoveExamScheduleDialog({ id, onRemove, onSuccess }: {
  id: string
  onRemove: (id: string) => Promise<void>
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await onRemove(id)
      setOpen(false)
      onSuccess()
    } catch { } finally { setRemoving(false) }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>পরীক্ষার সময়সূচী মুছবেন?</AlertDialogTitle>
          <AlertDialogDescription>
            সময়সূচীটি স্থায়ীভাবে মুছে যাবে। প্যাকেজটি কিন্তু থাকবে — শুধু এই কোর্সের সময়সূচী সরানো হবে।
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>বাতিল</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={removing} className="bg-destructive hover:bg-destructive/90">
            {removing ? 'মুছছে...' : 'মুছুন'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
