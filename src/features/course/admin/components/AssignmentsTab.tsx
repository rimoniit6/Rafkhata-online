'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PenSquare, CheckCircle, Clock, User, Loader2, Star, MessageSquare, ChevronDown, ChevronUp,
  BookOpen, FileText, AlertCircle, Search, Plus, X, Trash2, Edit3, RefreshCw, FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const GRADE_OPTIONS = [
  { label: 'A+', value: 5.0 },
  { label: 'A', value: 4.0 },
  { label: 'A-', value: 3.5 },
  { label: 'B', value: 3.0 },
  { label: 'C', value: 2.0 },
  { label: 'D', value: 1.0 },
  { label: 'F', value: 0.0 },
]

const GRADE_LABEL: Record<number, string> = {}
for (const g of GRADE_OPTIONS) GRADE_LABEL[g.value] = g.label

function formatGrade(marks: number | null): string {
  if (marks === null) return '-'
  return GRADE_LABEL[marks] ?? String(marks)
}

interface Props {
  courseId: string
}

interface SubmissionRecord {
  id: string
  assignmentId: string
  userId: string
  content: string | null
  fileUrls: string | null
  status: string
  marks: number | null
  feedback: string | null
  submittedAt: string
  user: { id: string; name: string | null; email: string; avatar: string | null }
  assignment: { id: string; title: string; lessonId: string }
}

interface AssignmentRecord {
  id: string
  title: string
  description: string | null
  lessonId: string
  deadline: string | null
  attachment: string | null
  lesson: { title: string } | null
  submissions: SubmissionRecord[]
}

interface LessonOption {
  id: string
  title: string
}

export default function AssignmentsTab({ courseId }: Props) {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [lessons, setLessons] = useState<LessonOption[]>([])
  const [loading, setLoading] = useState(true)

  // Create assignment form
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLessonId, setFormLessonId] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formAttachment, setFormAttachment] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Grading
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null)
  const [gradeMarks, setGradeMarks] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [bulkMarks, setBulkMarks] = useState('')
  const [bulkAssignmentId, setBulkAssignmentId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [networkError, setNetworkError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setNetworkError('')
    try {
      const [lessonsRes, assignRes] = await Promise.all([
        fetch(`/api/admin/courses/lessons?courseId=${courseId}`),
        fetch(`/api/admin/courses/assignments?action=course-list&courseId=${courseId}&_=${Date.now()}`),
      ])

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json()
        const unwrappedLessons = lessonsData.data || lessonsData
        setLessons((unwrappedLessons.lessons || []).map((l: any) => ({ id: l.id, title: l.title })))
      } else {
        const err = await lessonsRes.text()
        console.error('Lessons fetch failed:', lessonsRes.status, err)
        setNetworkError(`লেসন ফেচ ব্যর্থ (${lessonsRes.status})`)
      }

      if (assignRes.ok) {
        const assignData = await assignRes.json()
        const unwrappedAssign = assignData.data || assignData
        if (!unwrappedAssign.assignments) console.warn('No assignments key in response:', unwrappedAssign)
        setAssignments(unwrappedAssign.assignments || [])
      } else {
        const err = await assignRes.text()
        console.error('Assignments fetch failed:', assignRes.status, err)
        setNetworkError(prev => prev + ` | অ্যাসাইনমেন্ট ফেচ ব্যর্থ (${assignRes.status})`)
      }
    } catch (e) {
      console.error('fetchData error:', e)
      setLessons([])
      setAssignments([])
    } finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormTitle(''); setFormDesc(''); setFormLessonId(''); setFormDeadline(''); setFormAttachment('')
    setEditId(null); setShowCreate(false)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formLessonId) { toast({ title: 'ত্রুটি', description: 'শিরোনাম ও পাঠ নির্বাচন করুন', variant: 'destructive' }); return }
    setFormSaving(true)
    try {
      const res = await fetch('/api/admin/courses/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editId ? 'update' : 'create',
          ...(editId ? { id: editId } : { lessonId: formLessonId }),
          title: formTitle.trim(),
          description: formDesc || null,
          deadline: formDeadline || null,
          attachment: formAttachment || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast({ title: 'ত্রুটি', description: json.error || 'ব্যর্থ হয়েছে', variant: 'destructive' }); return }
      toast({ title: editId ? 'অ্যাসাইনমেন্ট আপডেট হয়েছে' : 'অ্যাসাইনমেন্ট তৈরি হয়েছে' })
      resetForm()
      fetchData()
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setFormSaving(false) }
  }

  const handleEdit = (a: AssignmentRecord) => {
    setEditId(a.id)
    setFormTitle(a.title)
    setFormDesc(a.description || '')
    setFormLessonId(a.lessonId)
    setFormDeadline(a.deadline ? a.deadline.split('T')[0] : '')
    setFormAttachment(a.attachment || '')
    setShowCreate(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/courses/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'অ্যাসাইনমেন্ট মুছে ফেলা হয়েছে' })
      fetchData()
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // Grading
  const allSubmissions = assignments.flatMap(a =>
    a.submissions.map(s => ({ ...s, assignmentTitle: a.title, lessonTitle: a.lesson?.title || '' }))
  )
  const pendingSubmissions = allSubmissions.filter(s => s.status === 'submitted')
  const gradedSubmissions = allSubmissions.filter(s => s.status === 'graded')
  const filteredPending = pendingSubmissions.filter(s =>
    s.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGrade = async () => {
    if (!selectedSubmission) return
    if (!gradeMarks) { toast({ title: 'ত্রুটি', description: 'গ্রেড নির্বাচন করুন', variant: 'destructive' }); return }
    const marks = parseFloat(gradeMarks)
    setGrading(true)
    try {
      const res = await fetch('/api/admin/courses/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grade', submissionId: selectedSubmission.id, marks, feedback: gradeFeedback || null }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'মূল্যায়ন সংরক্ষিত হয়েছে' })
      setSelectedSubmission(null)
      setGradeMarks(''); setGradeFeedback('')
      fetchData()
    } catch { toast({ title: 'ত্রুটি', description: 'মূল্যায়ন সংরক্ষণে সমস্যা', variant: 'destructive' }) }
    finally { setGrading(false) }
  }

  const handleBulkGrade = async () => {
    if (!bulkAssignmentId) return
    if (!bulkMarks) { toast({ title: 'ত্রুটি', description: 'গ্রেড নির্বাচন করুন', variant: 'destructive' }); return }
    const marks = parseFloat(bulkMarks)
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/courses/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-grade', assignmentId: bulkAssignmentId, defaultMarks: marks }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'সকল জমা মূল্যায়ন করা হয়েছে' })
      setBulkAssignmentId(null); setBulkMarks('')
      fetchData()
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setBulkLoading(false) }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingSubmissions.length}</p>
            <p className="text-xs text-muted-foreground">মূল্যায়ন বাকি</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{gradedSubmissions.length}</p>
            <p className="text-xs text-muted-foreground">মূল্যায়ন করা হয়েছে</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{allSubmissions.length}</p>
            <p className="text-xs text-muted-foreground">মোট জমা</p>
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              {editId ? 'অ্যাসাইনমেন্ট সম্পাদনা' : 'নতুন অ্যাসাইনমেন্ট'}
            </span>
            {!showCreate ? (
              <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowCreate(true) }}>
                <Plus className="h-4 w-4" />তৈরি করুন
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={resetForm}>
                <X className="h-4 w-4" />বাতিল
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {showCreate && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>শিরোনাম <span className="text-destructive">*</span></Label>
                <Input placeholder="অ্যাসাইনমেন্টের শিরোনাম" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>পাঠ (ক্লাস) <span className="text-destructive">*</span></Label>
                <Select value={formLessonId} onValueChange={setFormLessonId}>
                  <SelectTrigger><SelectValue placeholder="পাঠ নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {lessons.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ডেডলাইন</Label>
                <Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ফাইল URL</Label>
                <Input placeholder="https://..." value={formAttachment} onChange={e => setFormAttachment(e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>বিবরণ</Label>
                <Textarea placeholder="অ্যাসাইনমেন্টের বিবরণ" value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={formSaving || !formTitle.trim() || !formLessonId} className="gap-1.5">
                {formSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" />{editId ? 'হালনাগাদ' : 'তৈরি করুন'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pending Submissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              মূল্যায়ন বাকি
            </span>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="ছাত্র বা অ্যাসাইনমেন্ট খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPending.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p>সকল অ্যাসাইনমেন্ট মূল্যায়ন করা হয়েছে</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y">
                {filteredPending.map((sub, idx) => (
                  <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <span className="w-6 shrink-0 text-center text-xs text-muted-foreground font-medium">{idx + 1}.</span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{sub.user.name || sub.user.email}</span>
                        <Badge variant="outline" className="text-[10px]">{sub.assignmentTitle}</Badge>
                        <Badge variant="outline" className="text-[10px] bg-muted">{sub.lessonTitle}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        জমা দিয়েছে: {new Date(sub.submittedAt).toLocaleString('bn-BD')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => { setSelectedSubmission(sub); setGradeMarks(''); setGradeFeedback('') }}
                    >
                      <Star className="h-4 w-4" />মূল্যায়ন
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {networkError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{networkError}</span>
          <Button size="sm" variant="ghost" className="ml-auto shrink-0 h-7 gap-1" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />পুনরায়
          </Button>
        </div>
      )}

      {/* Assignment List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenSquare className="h-4 w-4" />
            অ্যাসাইনমেন্ট সমূহ ({assignments.length})
            <Button size="sm" variant="ghost" className="h-7 w-7 ml-auto" onClick={fetchData} title="পুনরায় লোড">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো অ্যাসাইনমেন্ট নেই। উপরের ফর্ম ব্যবহার করে তৈরি করুন।</p>
          ) : (
            assignments.map(a => {
              const pendingCount = a.submissions.filter(s => s.status === 'submitted').length
              return (
                <div key={a.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{a.title}</span>
                        <Badge variant="outline" className="text-[10px] bg-primary/5">
                          <BookOpen className="h-3 w-3 mr-1 inline" />{a.lesson?.title || 'Unknown'}
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.submissions.length}টি জমা • {pendingCount}টি বাকি
                        {a.deadline && ` • শেষ সময়: ${new Date(a.deadline).toLocaleDateString('bn-BD')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(a)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {pendingCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => { setBulkAssignmentId(a.id); setBulkMarks('') }}
                        >
                          <Star className="h-3.5 w-3.5" />সব মূল্যায়ন ({pendingCount})
                        </Button>
                      )}
                    </div>
                  </div>

                  {a.submissions.filter(s => s.status === 'graded').length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">মূল্যায়ন করা হয়েছে:</p>
                      {a.submissions.filter(s => s.status === 'graded').map((s, idx) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => { setSelectedSubmission(s); setGradeMarks(String(s.marks)); setGradeFeedback(s.feedback || '') }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 shrink-0 text-xs text-muted-foreground text-right">{idx + 1}.</span>
                            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{s.user.name || s.user.email}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-green-600">{formatGrade(s.marks)}</span>
                            {s.feedback && (
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{s.feedback}</span>
                            )}
                            <Edit3 className="h-3 w-3 text-muted-foreground/40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      {selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  {selectedSubmission.status === 'graded' ? 'মূল্যায়ন সম্পাদনা' : 'অ্যাসাইনমেন্ট মূল্যায়ন'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSubmission.user.name || selectedSubmission.user.email} — {selectedSubmission.assignment.title}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(null)}>
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">ছাত্রের উত্তর</Label>
                <div className="mt-1 rounded-lg bg-muted/50 p-4 whitespace-pre-wrap text-sm">
                  {selectedSubmission.content || 'কোনো টেক্সট উত্তর নেই'}
                </div>
              </div>

              {selectedSubmission.fileUrls && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">ফাইল</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {selectedSubmission.fileUrls.split(',').map((url, i) => {
                      const trimmedUrl = url.trim()
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(trimmedUrl) || /^data:image\//.test(trimmedUrl)
                      return (
                        <a key={i} href={trimmedUrl} target="_blank" rel="noopener noreferrer"
                          className="group relative rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                          {isImage ? (
                            <div className="aspect-video relative bg-muted">
                              <img
                                src={trimmedUrl}
                                alt={`ফাইল ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                          )}
                          <div className="p-2 text-center">
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {isImage ? `ছবি ${i + 1}` : `PDF ${i + 1}`}
                            </span>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">জমা দেওয়ার সময়</Label>
                <p className="text-sm mt-1">{new Date(selectedSubmission.submittedAt).toLocaleString('bn-BD')}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>গ্রেড <span className="text-destructive">*</span></Label>
                  <Select value={gradeMarks} onValueChange={setGradeMarks}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="গ্রেড নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map(g => (
                        <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>মতামত (ঐচ্ছিক)</Label>
                  <Textarea placeholder="ছাত্রকে মতামত জানান..." value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} rows={3} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>বাতিল</Button>
              <Button onClick={handleGrade} disabled={grading || !gradeMarks} className="gap-2">
                {grading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Star className="h-4 w-4" />{selectedSubmission.status === 'graded' ? 'হালনাগাদ করুন' : 'মূল্যায়ন করুন'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bulk Grade Dialog */}
      {bulkAssignmentId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setBulkAssignmentId(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl bg-background shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                সকল জমা মূল্যায়ন
              </h3>
              <p className="text-sm text-muted-foreground">
                সকল pending জমাতে একই গ্রেড সেট হবে। পরে পৃথকভাবে পরিবর্তন করতে পারবেন।
              </p>
              <div className="space-y-2">
                <Label>গ্রেড <span className="text-destructive">*</span></Label>
                <Select value={bulkMarks} onValueChange={setBulkMarks}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="গ্রেড নির্বাচন" /></SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setBulkAssignmentId(null)}>বাতিল</Button>
              <Button onClick={handleBulkGrade} disabled={bulkLoading || !bulkMarks} className="gap-2">
                {bulkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" />সব মূল্যায়ন করুন
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}