'use client'

import React from 'react'
import { Search, Loader2, Plus, FileQuestion, CheckSquare, Square, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { CQSearchResult } from '@/features/cq-exam/types'

interface CqSubjectOption {
  id: string
  name: string
}

interface CQQuestionSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchCqClassLevel: string
  setSearchCqClassLevel: (v: string) => void
  classLevelLabels: Record<string, string>
  searchCqSubjectId: string
  setSearchCqSubjectId: (v: string) => void
  searchCqSubjects: CqSubjectOption[]
  searchCqChapterId: string
  setSearchCqChapterId: (v: string) => void
  searchCqChapters: { id: string; name: string }[]
  searchCqText: string
  setSearchCqText: (v: string) => void
  onSearch: () => void
  loading: boolean
  results: CQSearchResult[]
  selectedIds: string[]
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  alreadyInSetIds: string[]
  saving: boolean
  onAddSelected: () => void
  onClassChange: (val: string) => void
  onSubjectChange: (val: string) => void
}

export function CQQuestionSearchDialog({
  open, onOpenChange, searchCqClassLevel, setSearchCqClassLevel, classLevelLabels,
  searchCqSubjectId, setSearchCqSubjectId, searchCqSubjects,
  searchCqChapterId, setSearchCqChapterId, searchCqChapters,
  searchCqText, setSearchCqText, onSearch, loading, results,
  selectedIds, setSelectedIds, alreadyInSetIds, saving, onAddSelected,
  onClassChange, onSubjectChange
}: CQQuestionSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-emerald-600" /> CQ খুঁজুন ও যোগ করুন
          </DialogTitle>
          <DialogDescription>
            শ্রেণি, বিষয় ও অধ্যায় অনুযায়ী CQ (উদ্দীপক ভিত্তিক) খুঁজুন এবং নির্বাচিত প্রশ্নগুলো সেটে যোগ করুন
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <Select value={searchCqClassLevel || '_all'} onValueChange={onClassChange}>
            <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">সকল শ্রেণি</SelectItem>
              {Object.entries(classLevelLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={searchCqSubjectId || '_all'} onValueChange={onSubjectChange}>
            <SelectTrigger><SelectValue placeholder="বিষয়" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">সকল বিষয়</SelectItem>
              {searchCqSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={searchCqChapterId || '_all'} onValueChange={(v) => setSearchCqChapterId(v === '_all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="অধ্যায়" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">সকল অধ্যায়</SelectItem>
              {searchCqChapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="উদ্দীপক লিখে খুঁজুন..."
              value={searchCqText}
              onChange={(e) => setSearchCqText(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
            />
          </div>
        </div>

        <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onSearch} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          খুঁজুন
        </Button>

        <div className="flex-1 overflow-y-auto max-h-96 min-h-0 space-y-2 mt-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <FileQuestion className="size-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">খুঁজুন বাটনে ক্লিক করে CQ খুঁজুন</p>
            </div>
          ) : (
            results.map((cq) => {
              const isSelected = selectedIds.includes(cq.id)
              const alreadyInSet = alreadyInSetIds.includes(cq.id)

              return (
                <div
                  key={cq.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-border/50 hover:border-emerald-300',
                    alreadyInSet && 'opacity-50 pointer-events-none'
                  )}
                  onClick={() => {
                    if (alreadyInSet) return
                    if (isSelected) {
                      setSelectedIds(prev => prev.filter(id => id !== cq.id))
                    } else {
                      setSelectedIds(prev => [...prev, cq.id])
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? <CheckSquare className="h-5 w-5 text-emerald-600" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-sky-600 mt-1 shrink-0" />
                      <RichContentRenderer content={cq.uddeepok} className="text-sm line-clamp-2" inline />
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 pl-5">
                      <span className="font-medium">প্রশ্ন ১:</span> <RichContentRenderer content={cq.question1} inline />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cq.chapter && <Badge variant="secondary" className="text-[10px] px-1.5">{cq.chapter.name}</Badge>}
                      {cq.subjectName && <span className="text-xs text-muted-foreground">• {cq.subjectName}</span>}
                      {alreadyInSet && <Badge variant="secondary" className="text-[10px] px-1.5">ইতিমধ্যে যোগ আছে</Badge>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">{selectedIds.length}টি প্রশ্ন নির্বাচিত</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>বন্ধ করুন</Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onAddSelected} disabled={selectedIds.length === 0 || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? 'যোগ হচ্ছে...' : `${selectedIds.length}টি যোগ করুন`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
