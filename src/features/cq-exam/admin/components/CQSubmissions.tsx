'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, ClipboardList, CheckCircle2, GraduationCap, FileText, RefreshCw, Search, CheckSquare, Filter, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CQExamSetRecord, CQExamSubmissionRecord } from '../../types'
import { formatDate, formatTime } from '@/features/mcq-exam/admin/components/MCQExamConstants'

const cqStatusInfo: Record<string, { label: string; className: string }> = {
  'not-started': { label: 'শুরু করেনি', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  'in-progress': { label: 'চলমান', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'submitted': { label: 'জমা দিয়েছে', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  'graded': { label: 'মূল্যায়িত', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  'published': { label: 'প্রকাশিত', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
}

const bengaliLabels = ['ক', 'খ', 'গ', 'ঘ']

interface CQSubmissionsProps {
  loading: boolean
  currentSet: CQExamSetRecord | null
  submissions: CQExamSubmissionRecord[]
  onBack: () => void
  selectedSubmission: CQExamSubmissionRecord | null
  setSelectedSubmission: (s: CQExamSubmissionRecord | null) => void
  detailOpen: boolean
  setDetailOpen: (open: boolean) => void
  classLevelLabels: Record<string, string>
  onStartGrading: (submission: CQExamSubmissionRecord) => void
  onPublishResults: (setId: string) => void
  onBulkGrade?: (setId: string, defaultMarks: number) => void
  onOpenBulkGrading?: () => void
  onAllowRetake?: (submissionId: string) => void
  onReopenGrading?: (submissionId: string) => void
  saving?: boolean
}

export function CQSubmissions({
  loading, currentSet, submissions, onBack,
  selectedSubmission, setSelectedSubmission, detailOpen, setDetailOpen,
  classLevelLabels, onStartGrading, onPublishResults,
  onBulkGrade, onOpenBulkGrading,   onAllowRetake, onReopenGrading, saving,
}: CQSubmissionsProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [bulkGradeConfirmOpen, setBulkGradeConfirmOpen] = useState(false)
  const [bulkGradeMarks, setBulkGradeMarks] = useState(0)

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false
      if (studentSearch) {
        const query = studentSearch.toLowerCase()
        const name = (sub.user?.name || '').toLowerCase()
        const email = (sub.user?.email || '').toLowerCase()
        if (!name.includes(query) && !email.includes(query)) return false
      }
      return true
    })
  }, [submissions, statusFilter, studentSearch])

  const gradedCount = submissions.filter(s => s.status === 'graded' || s.status === 'published').length
  const pendingCount = submissions.filter(s => s.status === 'submitted').length
  const totalMarks = currentSet?.totalMarks || 0

  // Count answer stats per submission
  const getAnswerStats = (sub: CQExamSubmissionRecord) => {
    const answers = sub.answers || []
    // Count unique questionIds that have at least one sub-answer with text or images
    const answeredQuestions = new Set(
      answers
        .filter(a => (a.answerText?.trim() || (a.images?.length ?? 0) > 0) && a.subIndex < 4)
        .map(a => a.questionId)
    )
    return {
      answered: answeredQuestions.size,
      total: new Set(answers.filter(a => a.subIndex < 4).map(a => a.questionId)).size,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" /> জমাকৃত উত্তর
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentSet?.title || ''} • {submissions.length}টি জমা {filteredSubmissions.length < submissions.length && `(${filteredSubmissions.length} দেখানো)`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো জমাকৃত উত্তর নেই</p>
        </div>
      ) : (
        <>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{submissions.length}</p>
                  <p className="text-xs text-muted-foreground">মোট জমা</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{gradedCount}</p>
                  <p className="text-xs text-muted-foreground">মূল্যায়িত</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">মূল্যায়ন বাকি</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sky-600">{submissions.filter(s => s.status === 'published').length}</p>
                  <p className="text-xs text-muted-foreground">প্রকাশিত</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="নাম বা ইমেইল দ্বারা খুঁজুন..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল</SelectItem>
                  <SelectItem value="submitted">জমা দিয়েছে</SelectItem>
                  <SelectItem value="graded">মূল্যায়িত</SelectItem>
                  <SelectItem value="published">প্রকাশিত</SelectItem>
                  <SelectItem value="in-progress">চলমান</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {onOpenBulkGrading && currentSet?.questions && currentSet.questions.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                  onClick={onOpenBulkGrading}
                >
                  <FileText className="h-4 w-4" />
                  প্রশ্ন ভিত্তিক গ্রেডিং
                </Button>
              )}
              {pendingCount > 0 && onBulkGrade && currentSet && (
                <Button
                  variant="outline"
                  className="gap-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                  onClick={() => setBulkGradeConfirmOpen(true)}
                  disabled={saving}
                >
                  <GraduationCap className="h-4 w-4" />
                  সব গ্রেডিং করুন ({pendingCount})
                </Button>
              )}
              {currentSet && (
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => onPublishResults(currentSet.id)}>
                  <CheckCircle2 className="h-4 w-4" /> ফলাফল প্রকাশ
                </Button>
              )}
            </div>
          </div>

          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ছাত্র</TableHead>
                  <TableHead>ক্লাস</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="hidden sm:table-cell">প্রাপ্ত নম্বর</TableHead>
                  <TableHead className="hidden md:table-cell">উত্তর</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      ফিল্টারের সাথে মিলে এমন কোনো জমা পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub, idx) => {
                    const statusInfo = cqStatusInfo[sub.status] || cqStatusInfo['not-started']
                    const stats = getAnswerStats(sub)
                    return (
                      <TableRow
                        key={sub.id}
                        className="cursor-pointer hover:bg-muted/80"
                        onClick={() => { setSelectedSubmission(sub); setDetailOpen(true) }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                              {sub.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{sub.user?.name || 'অজানা'}</p>
                              <p className="text-xs text-muted-foreground">{sub.user?.email || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{sub.user?.classLevel ? (classLevelLabels[sub.user.classLevel] || sub.user.classLevel) : '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-[10px] px-1.5', statusInfo.className)}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-semibold">
                            {sub.obtainedMarks ?? '—'}
                            <span className="text-muted-foreground text-xs">/{totalMarks}</span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs">
                              {stats.answered}/{stats.total} <span className="text-muted-foreground">প্রশ্ন</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {sub.status === 'submitted' && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs"
                                onClick={() => onStartGrading(sub)}
                              >
                                <GraduationCap className="h-3.5 w-3.5" /> গ্রেডিং
                              </Button>
                            )}
                            {sub.status === 'graded' && (
                              <>
                                {onReopenGrading && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                                    onClick={() => onReopenGrading(sub.id)}
                                    disabled={saving}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    পুনরায় গ্রেডিং
                                  </Button>
                                )}
                                {onAllowRetake && (
                                  <Button
                                    size="sm"
                                    variant={sub.canRetake ? 'default' : 'outline'}
                                    className={cn(
                                      'gap-1 text-xs',
                                      sub.canRetake
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400'
                                    )}
                                    onClick={() => onAllowRetake(sub.id)}
                                    disabled={saving}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    {sub.canRetake ? 'রিটেক দেওয়া' : 'রিটেক দিন'}
                                  </Button>
                                )}
                                {!onReopenGrading && !onAllowRetake && (
                                  <span className="text-xs text-emerald-600 font-medium">মূল্যায়িত</span>
                                )}
                              </>
                            )}
                            {sub.status === 'published' && (
                              <>
                                {onAllowRetake && (
                                  <Button
                                    size="sm"
                                    variant={sub.canRetake ? 'default' : 'outline'}
                                    className={cn(
                                      'gap-1 text-xs',
                                      sub.canRetake
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400'
                                    )}
                                    onClick={() => onAllowRetake(sub.id)}
                                    disabled={saving}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    {sub.canRetake ? 'রিটেক দেওয়া' : 'রিটেক দিন'}
                                  </Button>
                                )}
                                {!onAllowRetake && (
                                  <span className="text-xs text-sky-600 font-medium">প্রকাশিত</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" /> জমার বিস্তারিত
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                  {selectedSubmission.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium">{selectedSubmission.user?.name || 'অজানা'}</p>
                  <p className="text-xs text-muted-foreground">{selectedSubmission.user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubmission.user?.classLevel ? classLevelLabels[selectedSubmission.user.classLevel] || selectedSubmission.user.classLevel : ''}
                  </p>
                </div>
              </div>

              <div className="text-center p-4 rounded-lg bg-emerald-50">
                <p className="text-4xl font-bold text-emerald-600">
                  {selectedSubmission.obtainedMarks ?? '—'}
                  <span className="text-lg text-muted-foreground">/{totalMarks}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">মোট নম্বর</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">স্ট্যাটাস</span>
                  <Badge className={cn('text-xs', cqStatusInfo[selectedSubmission.status]?.className)}>
                    {cqStatusInfo[selectedSubmission.status]?.label || selectedSubmission.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সময় নিয়েছে</span>
                  <span className="font-medium">{selectedSubmission.timeTaken ? formatTime(selectedSubmission.timeTaken) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">জমা দেওয়ার সময়</span>
                  <span>{selectedSubmission.submittedAt ? formatDate(selectedSubmission.submittedAt) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মূল্যায়নের সময়</span>
                  <span>{selectedSubmission.gradedAt ? formatDate(selectedSubmission.gradedAt) : '—'}</span>
                </div>
              </div>

              {/* Answer preview in detail */}
              {(selectedSubmission.answers?.length ?? 0) > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-emerald-600" />
                      উত্তরের সারসংক্ষেপ
                    </p>
                    <div className="space-y-1.5">
                      {selectedSubmission.answers
                        .filter(a => a.subIndex < 4)
                        .reduce<{ questionId: string; answered: number; total: number }[]>((acc, a) => {
                          const existing = acc.find(x => x.questionId === a.questionId)
                          if (existing) {
                            existing.total++
                            if (a.answerText?.trim() || (a.images?.length ?? 0) > 0) existing.answered++
                          } else {
                            acc.push({
                              questionId: a.questionId,
                              answered: (a.answerText?.trim() || (a.images?.length ?? 0) > 0) ? 1 : 0,
                              total: 1,
                            })
                          }
                          return acc
                        }, [])
                        .map((q, i) => (
                          <div key={q.questionId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <span className="text-xs font-medium">CQ {i + 1}</span>
                            <span className={cn(
                              'text-xs',
                              q.answered === q.total ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {q.answered}/{q.total} উত্তর
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {selectedSubmission.status === 'submitted' && (
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => { setDetailOpen(false); onStartGrading(selectedSubmission) }}
                >
                  <GraduationCap className="h-4 w-4" /> গ্রেডিং করুন
                </Button>
              )}
              {(selectedSubmission.status === 'graded' || selectedSubmission.status === 'published') && onAllowRetake && (
                <Button
                  className={cn(
                    'w-full gap-2',
                    selectedSubmission.canRetake
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-amber-300'
                  )}
                  onClick={() => { setDetailOpen(false); onAllowRetake(selectedSubmission.id) }}
                  disabled={saving}
                >
                  <RefreshCw className="h-4 w-4" />
                  {selectedSubmission.canRetake ? 'পুনরায় পরীক্ষার অনুমতি প্রত্যাহার করুন' : 'পুনরায় পরীক্ষার অনুমতি দিন'}
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk grade confirmation */}
      <AlertDialog open={bulkGradeConfirmOpen} onOpenChange={setBulkGradeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              সকল জমা একসাথে গ্রেডিং করুন
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  আপনি কি {pendingCount}টি জমাকৃত উত্তর একসাথে গ্রেডিং করতে চান?
                </p>

                {/* Default marks input */}
                <div className="bg-muted/40 p-3 rounded-lg border">
                  <label className="text-sm font-medium mb-1.5 block">
                    প্রতিটি উত্তরে ডিফল্ট নম্বর
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      min={0}
                      max={currentSet?.totalMarks || 100}
                      value={bulkGradeMarks}
                      onChange={(e) => setBulkGradeMarks(parseFloat(e.target.value) || 0)}
                      className="w-24 h-9 text-center text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      (সর্বোচ্চ {currentSet?.totalMarks || '—'})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">
                    {bulkGradeMarks === 0
                      ? 'সকল উত্তরের নম্বর 0 হবে — পরে ম্যানুয়ালি গ্রেড করুন'
                      : `প্রতিটি উত্তরে ${bulkGradeMarks} নম্বর করে দেওয়া হবে (সর্বোচ্চ ${currentSet?.totalMarks || '—'} পর্যন্ত)`
                    }
                  </p>
                </div>

                <p className="text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                  <strong>বিঃদ্রঃ</strong> স্ট্যাটাস "মূল্যায়িত" হবে। প্রতিটি উত্তর আলাদাভাবে গ্রেড করতে
                  চাইলে "গ্রেডিং" বাটন ব্যবহার করুন।
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              disabled={saving}
              onClick={() => {
                setBulkGradeConfirmOpen(false)
                if (currentSet) onBulkGrade?.(currentSet.id, bulkGradeMarks)
              }}
            >
              {saving ? 'প্রক্রিয়াধীন...' : `হ্যাঁ, ${pendingCount}টি গ্রেডিং করুন`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
