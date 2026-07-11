'use client'

import DataTable,{ type BulkAction,type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { QueryError } from '@/components/admin/QueryError'
import { Skeleton } from '@/components/ui/skeleton'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import {
BarChart3,
ClipboardCheck,
Clock,
Eye,
Search,
Trash2,
TrendingUp,
Trophy,
} from 'lucide-react'
import { useState } from 'react'

import { useExamResults } from '@/hooks/admin/use-exam-results'
import { useExams } from '@/hooks/admin/use-exams'
import { examResultService } from '@/services/api/exam-result.service'

interface ExamResultRecord {
  id: string
  userId: string
  examId: string
  score: number
  totalMarks: number
  timeTaken: number
  answers: string
  completedAt: string
  user: { id: string; name: string; email: string }
  exam: { id: string; title: string; type: string; classLevel: string; totalMarks: number }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} মি ${s} সে`
}

function getScoreColor(score: number, total: number): string {
  const pct = total > 0 ? (score / total) * 100 : 0
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
  if (pct >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

export default function AdminExamResultsPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [examFilter, setExamFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [detailResult, setDetailResult] = useState<ExamResultRecord | null>(null)
  const limit = 20

  const { results, pagination, stats, isLoading, isError, error, refetch, invalidate } = useExamResults({
    page,
    limit,
    examId: examFilter !== 'all' ? examFilter : undefined,
    userId: userSearch || undefined,
  })

  const total = pagination?.total ?? 0

  const { exams } = useExams({ limit: 100 })

  const parseAnswers = (answers: unknown) => answers

  const selection = useTableSelection(results)

  const handleBulkDelete = async (ids: string[]) => {
    await examResultService.bulkDelete(ids)
    toast({ title: 'মুছে ফেলা হয়েছে' })
    selection.clearSelection()
    invalidate()
  }

  const columns: ColumnDef<ExamResultRecord>[] = [
    {
      key: 'student',
      header: 'শিক্ষার্থী',
      render: (result) => (
        <div>
          <p className="font-medium text-sm">{result.user?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{result.user?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'exam',
      header: 'পরীক্ষা',
      render: (result) => (
        <div>
          <p className="text-sm font-medium line-clamp-1">{result.exam?.title || 'N/A'}</p>
          <Badge variant="outline" className="text-[9px] h-4 px-1 mt-0.5">{result.exam?.type || '-'}</Badge>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'স্কোর',
      render: (result) => {
        const pct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <Badge className={getScoreColor(result.score, result.totalMarks)}>
              {result.score}/{result.totalMarks}
            </Badge>
            <span className="text-xs text-muted-foreground">({pct}%)</span>
          </div>
        )
      },
    },
    {
      key: 'time',
      header: 'সময়',
      headerClass: 'hidden sm:table-cell',
      cellClass: 'hidden sm:table-cell',
      render: (result) => <span className="text-sm">{formatTime(result.timeTaken)}</span>,
    },
    {
      key: 'date',
      header: 'তারিখ',
      headerClass: 'hidden md:table-cell',
      cellClass: 'hidden md:table-cell',
      render: (result) => <span className="text-sm">{new Date(result.completedAt).toLocaleDateString('bn-BD')}</span>,
    },
    {
      key: 'actions',
      header: '',
      cellClass: 'w-20',
      render: (result) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailResult(result)} aria-label="বিস্তারিত">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
    },
  ]

  const filters = (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ব্যবহারকারী ID দিয়ে খুঁজুন..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={examFilter} onValueChange={(v) => { setExamFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="পরীক্ষা নির্বাচন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব পরীক্ষা</SelectItem>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-emerald-600" /> পরীক্ষার ফলাফল
        </h1>
        <p className="text-muted-foreground text-sm mt-1">সকল পরীক্ষার ফলাফল দেখুন ও পরিচালনা করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট ফলাফল</p>
              <p className="text-xl font-bold">{(stats?.totalResults ?? 0).toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">গড় স্কোর</p>
              <p className="text-xl font-bold">{stats?.avgScore ?? 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30">
              <Clock className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">গড় সময়</p>
              <p className="text-xl font-bold">{formatTime(stats?.avgTime ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30">
              <Trophy className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সর্বোচ্চ স্কোর</p>
              <p className="text-xl font-bold">{stats?.highestScore ?? 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={results}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        loading={isLoading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো ফলাফল পাওয়া যায়নি"
        filters={filters}
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailResult} onOpenChange={() => setDetailResult(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ফলাফলের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {detailResult && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">শিক্ষার্থী:</div>
                  <div className="font-medium">{detailResult.user?.name || 'N/A'}</div>
                  <div className="text-muted-foreground">ইমেইল:</div>
                  <div className="font-medium text-xs">{detailResult.user?.email || '-'}</div>
                </div>
              </div>

              {/* Exam info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">পরীক্ষা:</div>
                  <div className="font-medium">{detailResult.exam?.title || '-'}</div>
                  <div className="text-muted-foreground">ধরন:</div>
                  <div className="font-medium">{detailResult.exam?.type || '-'}</div>
                  <div className="text-muted-foreground">শ্রেণি:</div>
                  <div className="font-medium">{detailResult.exam?.classLevel || '-'}</div>
                </div>
              </div>

              {/* Score */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">স্কোর</p>
                    <p className="text-xl font-bold">
                      {detailResult.score}/{detailResult.totalMarks}
                    </p>
                    <Badge className={getScoreColor(detailResult.score, detailResult.totalMarks) + ' mt-1'}>
                      {detailResult.totalMarks > 0
                        ? Math.round((detailResult.score / detailResult.totalMarks) * 100)
                        : 0}%
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">সময়</p>
                    <p className="text-xl font-bold">{formatTime(detailResult.timeTaken)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(detailResult.completedAt).toLocaleDateString('bn-BD')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Answers JSON */}
              <div>
                <p className="text-sm font-semibold mb-2">উত্তরমালা (JSON)</p>
                <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(parseAnswers(detailResult.answers), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailResult(null)}>বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
