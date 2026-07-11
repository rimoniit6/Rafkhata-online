import BulkImportDialog from '@/components/admin/BulkImportDialog'
import DataTable from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlignLeft, Crown, Edit, Plus, Search, Trash2, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import React from 'react'
import type { CQRecord, ClassItem } from './types'
import { difficultyLabels, difficultyColors } from './types'

interface CQListViewProps {
  total: number
  cqs: CQRecord[]
  loading: boolean
  page: number
  perPage: number
  setPage: (page: number) => void
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
  selection: {
    selectedIds: string[]
    toggleOne: (id: string) => void
    toggleAll: () => void
    allVisibleSelected: boolean
    someVisibleSelected: boolean
  }
  openEdit: (cq: CQRecord) => void
  openCreate: () => void
  setDeleteId: (id: string | null) => void
  handleBulkDelete: (ids: string[]) => Promise<void>
  fetchCqs: () => void
  bulkImportOpen: boolean
  setBulkImportOpen: (v: boolean) => void
  deleteId: string | null
  handleDelete: () => Promise<void>
}

export default function CQListView({
  total,
  cqs,
  loading,
  page,
  perPage,
  setPage,
  search,
  setSearch,
  classFilter,
  setClassFilter,
  boardFilter,
  setBoardFilter,
  yearFilter,
  setYearFilter,
  difficultyFilter,
  setDifficultyFilter,
  premiumFilter,
  setPremiumFilter,
  classes,
  boardOptions,
  classLabelMap,
  boardLabelMap,
  selection,
  openEdit,
  openCreate,
  setDeleteId,
  handleBulkDelete,
  fetchCqs,
  bulkImportOpen,
  setBulkImportOpen,
  deleteId,
  handleDelete,
}: CQListViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlignLeft className="h-6 w-6 text-emerald-600" /> CQ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">মোট {total}টি CQ</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkImportOpen(true)}
          >
            <Upload className="h-4 w-4" /> বাল্ক ইম্পোর্ট
          </Button>
          <BulkImportDialog
            open={bulkImportOpen}
            onOpenChange={setBulkImportOpen}
            defaultType="cq"
            onSuccess={fetchCqs}
          />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" /> নতুন CQ যোগ করুন
          </Button>
        </div>
      </div>

      <DataTable<CQRecord>
        columns={[
          {
            key: 'uddeepok',
            header: 'উদ্দীপক',
            render: (cq) => <RichContentRenderer content={cq.uddeepok} inline />,
            cellClass: 'font-medium max-w-[200px] truncate',
          },
          {
            key: 'classLevel',
            header: 'ক্লাস',
            render: (cq) => classLabelMap[cq.classLevel] || cq.classLevel,
            cellClass: 'hidden sm:table-cell',
          },
          {
            key: 'chapter',
            header: 'অধ্যায়',
            render: (cq) => cq.chapter?.name || '-',
            cellClass: 'hidden md:table-cell',
          },
          {
            key: 'board',
            header: 'বোর্ড',
            render: (cq) => (cq.board ? boardLabelMap[cq.board] || cq.board : '-'),
            cellClass: 'hidden lg:table-cell',
          },
          {
            key: 'year',
            header: 'সাল',
            render: (cq) => cq.year || '-',
            cellClass: 'hidden lg:table-cell',
          },
          {
            key: 'difficulty',
            header: 'কঠিনতা',
            render: (cq) => (
              <Badge className={difficultyColors[cq.difficulty] || ''}>
                {difficultyLabels[cq.difficulty] || cq.difficulty}
              </Badge>
            ),
          },
          {
            key: 'premium',
            header: 'প্রিমিয়াম',
            render: (cq) =>
              cq.isPremium ? (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                  <Crown className="h-3 w-3" />প্রিমিয়াম
                </Badge>
              ) : (
                <Badge variant="secondary">ফ্রি</Badge>
              ),
          },
          {
            key: 'actions',
            header: 'অ্যাকশন',
            cellClass: 'w-20',
            render: (cq) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cq)} aria-label="সম্পাদনা">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cq.id)} aria-label="মুছুন">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={cqs}
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
        bulkActions={[{ label: 'মুছুন', variant: 'destructive', handler: handleBulkDelete }]}
        emptyMessage="কোনো CQ পাওয়া যায়নি"
        filters={
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="উদ্দীপক দিয়ে খুঁজুন..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
                </div>
                <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ক্লাস" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ক্লাস</SelectItem>
                    {classes.map((c) => (<SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={boardFilter} onValueChange={(v) => { setBoardFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="বোর্ড" /></SelectTrigger>
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
                  onChange={(e) => {
                    setYearFilter(e.target.value || 'all')
                    setPage(1)
                  }}
                  className="w-full sm:w-32"
                />
                <Select value={difficultyFilter} onValueChange={(v) => { setDifficultyFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="কঠিনতা" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব</SelectItem>
                    <SelectItem value="easy">সহজ</SelectItem>
                    <SelectItem value="medium">মাঝারি</SelectItem>
                    <SelectItem value="hard">কঠিন</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="প্রিমিয়াম" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব</SelectItem>
                    <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                    <SelectItem value="free">ফ্রি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        }
      />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CQ মুছুন</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই CQ মুছে ফেলতে চান?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDelete}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
