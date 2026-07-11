import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import type { ImportResult, ImportHistoryItem } from './types'

export function StepResults({
  result,
  importing,
  importProgress,
  importType,
  isBoard,
  file,
  selectedClassName,
  selectedSubjectName,
  selectedChapterName,
  selectedBoardName,
  year,
  importHistory,
}: {
  result: ImportResult
  importing: boolean
  importProgress: number
  importType: 'mcq' | 'cq'
  isBoard: boolean
  file: File | null
  selectedClassName: string
  selectedSubjectName: string
  selectedChapterName: string
  selectedBoardName: string
  year: string
  importHistory: ImportHistoryItem[]
}) {
  return (
    <div className="space-y-6">
      {importing && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <div>
                <p className="font-semibold">ইম্পোর্ট হচ্ছে...</p>
                <p className="text-xs text-muted-foreground">অনুগ্রহ করে অপেক্ষা করুন</p>
              </div>
            </div>
            <Progress value={importProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Card className={cn(
        'border-2',
        result.errors.length === 0 ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/10' : 'border-amber-300 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/10'
      )}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            {result.errors.length === 0 ? (
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">
                {result.errors.length === 0 ? 'সব সফল!' : 'আংশিক সফল'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {result.success}/{result.total}টি প্রশ্ন ইম্পোর্ট হয়েছে
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-white/80 dark:bg-background/80 border">
              <p className="text-3xl font-bold">{result.total}</p>
              <p className="text-xs text-muted-foreground mt-1">মোট সারি</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-3xl font-bold text-emerald-600">{result.success}</p>
              <p className="text-xs text-muted-foreground mt-1">সফল</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-3xl font-bold text-red-600">{result.errors.length}</p>
              <p className="text-xs text-muted-foreground mt-1">ত্রুটি</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-sm font-semibold text-amber-700 dark:text-amber-400 gap-1">
                <AlertCircle className="h-4 w-4" />
                ত্রুটির বিবরণ ({result.errors.length}টি)
              </Badge>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-xl p-3 bg-white/50 dark:bg-background/50">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs py-1">
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                      সারি {err.row}
                    </Badge>
                    <span className="text-amber-800 dark:text-amber-200">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Card className="bg-white/60 dark:bg-background/60 border-border/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ধরন:</span>
                  <span className="font-medium">{importType === 'mcq' ? 'MCQ' : 'CQ'} {isBoard ? '(বোর্ড)' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ফাইল:</span>
                  <span className="font-medium">{file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ক্লাস:</span>
                  <span className="font-medium">{selectedClassName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">বিষয়:</span>
                  <span className="font-medium">{selectedSubjectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">অধ্যায়:</span>
                  <span className="font-medium">{selectedChapterName}</span>
                </div>
                {isBoard && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">বোর্ড:</span>
                      <span className="font-medium">{selectedBoardName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">সাল:</span>
                      <span className="font-medium">{year}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {importHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ইম্পোর্ট হিস্ট্রি</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-40 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">ধরন</TableHead>
                    <TableHead className="text-xs">ফাইল</TableHead>
                    <TableHead className="text-xs">সফল</TableHead>
                    <TableHead className="text-xs">ত্রুটি</TableHead>
                    <TableHead className="text-xs">সময়</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.slice(0, 5).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {item.type.toUpperCase()} {item.isBoard ? '(বোর্ড)' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{item.fileName}</TableCell>
                      <TableCell className="text-xs text-emerald-600 font-semibold">{item.successCount}</TableCell>
                      <TableCell className="text-xs text-red-600 font-semibold">{item.errorCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleTimeString('bn-BD')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
