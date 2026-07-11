'use client'

import DataTable, { type BulkAction, type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Crown, Edit, FileQuestion, Archive, Trash2 } from 'lucide-react'
import { difficultyColors, difficultyLabels, typeColors, typeLabels } from './constants'
import type { BoardQuestion } from './types'

interface BoardQuestionListProps {
  questions: BoardQuestion[]
  total: number
  page: number
  perPage: number
  setPage: (v: number) => void
  loading: boolean
  selection: {
    selectedIds: string[]
    toggleOne: (id: string) => void
    toggleAll: () => void
    allVisibleSelected: boolean
    someVisibleSelected: boolean
  }
  bulkActions: BulkAction[]
  openEdit: (q: BoardQuestion) => void
  setDeleteInfo: (v: { id: string; type: 'mcq' | 'cq' } | null) => void
  classLabelMap: Record<string, string>
  boardLabelMap: Record<string, string>
  totalStats: { total: number; boardCount: number; mcqCount: number; cqCount: number }
  filters?: React.ReactNode
}

export default function BoardQuestionList({
  questions, total, page, perPage, setPage, loading,
  selection, bulkActions, openEdit, setDeleteInfo,
  classLabelMap, boardLabelMap, totalStats, filters,
}: BoardQuestionListProps) {
  const columns: ColumnDef<BoardQuestion>[] = [
    { key: 'title', header: 'শিরোনাম', render: (q) => <span className="font-medium max-w-[200px] truncate block">{q.title}</span> },
    { key: 'type', header: 'ধরন', render: (q) => <Badge className={typeColors[q.type]}>{typeLabels[q.type]}</Badge> },
    { key: 'board', header: 'বোর্ড', cellClass: 'hidden sm:table-cell', render: (q) => <>{q.board ? boardLabelMap[q.board] || q.board : '-'}</> },
    { key: 'year', header: 'সাল', cellClass: 'hidden sm:table-cell', render: (q) => <>{q.year || '-'}</> },
    { key: 'classLevel', header: 'ক্লাস', cellClass: 'hidden md:table-cell', render: (q) => <>{classLabelMap[q.classLevel] || q.classLevel}</> },
    { key: 'subject', header: 'বিষয়', cellClass: 'hidden lg:table-cell', render: (q) => <>{q.subject?.name || q.chapter?.subject?.name || '-'}</> },
    { key: 'difficulty', header: 'কঠিনতা', cellClass: 'hidden md:table-cell', render: (q) => <Badge className={difficultyColors[q.difficulty]}>{difficultyLabels[q.difficulty] || q.difficulty}</Badge> },
    { key: 'isPremium', header: 'প্রিমিয়াম', cellClass: 'hidden lg:table-cell', render: (q) => q.isPremium ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1"><Crown className="h-3 w-3" />প্রিমিয়াম</Badge> : <Badge variant="secondary">ফ্রি</Badge> },
    { key: 'actions', header: '', render: (q) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(q)} aria-label="সম্পাদনা">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteInfo({ id: q.id, type: q.type })} aria-label="মুছুন">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ]

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">মোট বোর্ড প্রশ্ন</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{totalStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Archive className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-muted-foreground">বোর্ড সংখ্যা</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{totalStats.boardCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">MCQ</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{totalStats.mcqCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-muted-foreground">CQ</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{totalStats.cqCount}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো বোর্ড প্রশ্ন পাওয়া যায়নি"
        filters={filters}
      />
    </>
  )
}
