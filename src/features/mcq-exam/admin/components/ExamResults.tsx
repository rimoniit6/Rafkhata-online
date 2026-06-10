'use client'

import { BarChart3, ArrowLeft, Trophy, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MCQExamSetRecord, MCQExamSetResultRecord } from '@/types/admin-mcq-exam'
import { formatDate, formatTime, statusColors } from './MCQExamConstants'

interface ExamResultsProps {
  loading: boolean
  currentSet: MCQExamSetRecord | null
  results: MCQExamSetResultRecord[]
  onBack: () => void
  selectedResult: MCQExamSetResultRecord | null
  setSelectedResult: (r: MCQExamSetResultRecord | null) => void
  detailOpen: boolean
  setDetailOpen: (open: boolean) => void
  classLevelLabels: Record<string, string>
}

export function ExamResults({
  loading, currentSet, results, onBack,
  selectedResult, setSelectedResult, detailOpen, setDetailOpen,
  classLevelLabels
}: ExamResultsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" /> ফলাফল
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentSet?.title || ''} • {results.length}টি ফলাফল
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো ফলাফল পাওয়া যায়নি</p>
        </div>
      ) : (
        <>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{results.length}</p>
                  <p className="text-xs text-muted-foreground">মোট পরীক্ষার্থী</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {(results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">গড় নম্বর</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.max(...results.map(r => r.marksObtained)).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">সর্বোচ্চ নম্বর</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {results.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">সম্পন্ন</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পরীক্ষার্থী</TableHead>
                  <TableHead>স্কোর</TableHead>
                  <TableHead className="hidden sm:table-cell">সঠিক</TableHead>
                  <TableHead className="hidden md:table-cell">সময়</TableHead>
                  <TableHead>জমা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => {
                  const totalMarks = result.totalMarks || currentSet?.totalMarks || 0
                  const percentage = totalMarks > 0 ? (result.marksObtained / totalMarks) * 100 : 0
                  return (
                    <TableRow key={result.id} className="cursor-pointer hover:bg-muted/80" onClick={() => { setSelectedResult(result); setDetailOpen(true); }}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                            {result.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{result.user?.name || 'অজানা'}</p>
                            <p className="text-xs text-muted-foreground">{result.user?.email || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{result.marksObtained}</span>
                          <span className="text-muted-foreground">/ {totalMarks}</span>
                          <Badge className={cn('text-[10px] px-1.5', percentage >= 80 ? 'bg-emerald-100 text-emerald-700' : percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><span className="text-emerald-600">{result.totalCorrect}</span></TableCell>
                      <TableCell className="hidden md:table-cell"><span className="text-sm">{formatTime(result.timeTaken)}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{result.submittedAt ? formatDate(result.submittedAt) : '—'}</span></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-emerald-600" /> ফলাফলের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-emerald-50">
                <p className="text-4xl font-bold text-emerald-600">{selectedResult.marksObtained}<span className="text-lg text-muted-foreground">/{selectedResult.totalMarks || currentSet?.totalMarks || 0}</span></p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-emerald-50 rounded-lg"><p className="font-bold text-emerald-600">{selectedResult.totalCorrect}</p><p className="text-[10px]">সঠিক</p></div>
                <div className="p-2 bg-red-50 rounded-lg"><p className="font-bold text-red-600">{selectedResult.totalWrong}</p><p className="text-[10px]">ভুল</p></div>
                <div className="p-2 bg-amber-50 rounded-lg"><p className="font-bold text-amber-600">{selectedResult.totalSkipped}</p><p className="text-[10px]">ছাড়</p></div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>সময় নিয়েছে</span><span className="font-medium">{formatTime(selectedResult.timeTaken)}</span></div>
                <div className="flex justify-between"><span>জমা</span><span>{selectedResult.submittedAt ? formatDate(selectedResult.submittedAt) : '—'}</span></div>
                <div className="flex justify-between"><span>স্ট্যাটাস</span><Badge className="text-xs">{selectedResult.status}</Badge></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>বন্ধ করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
