'use client'

import BulkImportDialog from '@/components/admin/BulkImportDialog'
import DataTable, { type BulkAction, type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Crown, Edit, FileQuestion, Plus, Search, Trash2, Upload } from 'lucide-react'
import { useCallback } from 'react'
import { difficultyColors, difficultyLabels } from './constants'
import type { ClassItem, MCQRecord } from './types'

interface MCQListViewProps {
  loading: boolean
  mcqs: MCQRecord[]
  total: number
  page: number
  perPage: number
  setPage: (v: number) => void
  search: string
  setSearch: (v: string) => void
  classFilter: string
  setClassFilter: (v: string) => void
  boardFilter: string
  setBoardFilter: (v: string) => void
  yearFilter: string
  setYearFilter: (v: string) => void
  difficultyFilter: string
  setDifficultyFilter: (v: string) => void
  premiumFilter: string
  setPremiumFilter: (v: string) => void
  classes: ClassItem[]
  boardOptions: { value: string; label: string }[]
  classLabelMap: Record<string, string>
  boardLabelMap: Record<string, string>
  openCreate: () => void
  openEdit: (mcq: MCQRecord) => void
  setDeleteId: (v: string | null) => void
  setBulkImportOpen: (v: boolean) => void
  bulkImportOpen: boolean
  fetchMcqs: () => Promise<void>
  selection: {
    selectedIds: string[]
    toggleOne: (id: string) => void
    toggleAll: () => void
    allVisibleSelected: boolean
    someVisibleSelected: boolean
    clearSelection: () => void
  }
}

export default function MCQListView({
  loading, mcqs, total, page, perPage, setPage,
  search, setSearch, classFilter, setClassFilter,
  boardFilter, setBoardFilter, yearFilter, setYearFilter,
  difficultyFilter, setDifficultyFilter, premiumFilter, setPremiumFilter,
  classes, boardOptions, classLabelMap, boardLabelMap,
  openCreate, openEdit, setDeleteId, setBulkImportOpen, bulkImportOpen,
  fetchMcqs, selection,
}: MCQListViewProps) {
  const { toast } = useToast()

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/mcq?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        selection.clearSelection()
        fetchMcqs()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }, [selection, fetchMcqs, toast])

  const columns: ColumnDef<MCQRecord>[] = [
    {
      key: 'question',
      header: 'প্রশ্ন',
      render: (mcq) => <RichContentRenderer content={mcq.question} inline />,
      cellClass: 'font-medium max-w-[200px] truncate',
    },
    {
      key: 'classLevel',
      header: 'ক্লাস',
      render: (mcq) => classLabelMap[mcq.classLevel] || mcq.classLevel,
      cellClass: 'hidden sm:table-cell',
    },
    {
      key: 'chapter',
      header: 'অধ্যায়',
      render: (mcq) => mcq.chapter?.name || '-',
      cellClass: 'hidden md:table-cell',
    },
    {
      key: 'board',
      header: 'বোর্ড',
      render: (mcq) => (mcq.board ? boardLabelMap[mcq.board] || mcq.board : '-'),
      cellClass: 'hidden lg:table-cell',
    },
    {
      key: 'year',
      header: 'সাল',
      render: (mcq) => mcq.year || '-',
      cellClass: 'hidden lg:table-cell',
    },
    {
      key: 'difficulty',
      header: 'কঠিনতা',
      render: (mcq) => (
        <Badge className={difficultyColors[mcq.difficulty] || ''}>
          {difficultyLabels[mcq.difficulty] || mcq.difficulty}
        </Badge>
      ),
    },
    {
      key: 'premium',
      header: 'প্রিমিয়াম',
      render: (mcq) =>
        mcq.isPremium ? (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
            <Crown className="h-3 w-3" />
            প্রিমিয়াম
          </Badge>
        ) : (
          <Badge variant="secondary">ফ্রি</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'অ্যাকশন',
      cellClass: 'w-20',
      render: (mcq) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(mcq)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(mcq.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    { label: 'মুছুন', variant: 'destructive', handler: handleBulkDelete },
  ]

  const filters = (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="প্রশ্ন দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="ক্লাস" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্লাস</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={boardFilter} onValueChange={(v) => { setBoardFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="বোর্ড" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব বোর্ড</SelectItem>
              {boardOptions.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="সাল"
            value={yearFilter === 'all' ? '' : yearFilter}
            onChange={(e) => { setYearFilter(e.target.value || 'all'); setPage(1) }}
            className="w-full sm:w-32"
          />
          <Select value={difficultyFilter} onValueChange={(v) => { setDifficultyFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="কঠিনতা" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="easy">সহজ</SelectItem>
              <SelectItem value="medium">মাঝারি</SelectItem>
              <SelectItem value="hard">কঠিন</SelectItem>
            </SelectContent>
          </Select>
          <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="প্রিমিয়াম" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="premium">প্রিমিয়াম</SelectItem>
              <SelectItem value="free">ফ্রি</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <FileQuestion className="h-5 w-5" />
            </div>
            MCQ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি MCQ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setBulkImportOpen(true)}>
            <Upload className="h-4 w-4" />
            বাল্ক ইম্পোর্ট
          </Button>
          <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} defaultType="mcq" onSuccess={fetchMcqs} />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            নতুন MCQ যোগ করুন
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={mcqs}
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
        emptyMessage="কোনো MCQ পাওয়া যায়নি"
        filters={filters}
      />
    </motion.div>
  )
}
