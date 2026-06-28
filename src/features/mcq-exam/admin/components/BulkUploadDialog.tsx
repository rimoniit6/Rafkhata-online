'use client'

import { FileSpreadsheet, Download, Upload, FileCheck, X, Info, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { SubjectOption } from '@/features/mcq-exam/types'

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects: SubjectOption[]
  subjectId: string
  setSubjectId: (id: string) => void
  file: File | null
  setFile: (file: File | null) => void
  loading: boolean
  result: { success: number; failed: number; errors: string[] } | null
  onUpload: () => void
  onDownloadTemplate: () => void
}

export function BulkUploadDialog({
  open, onOpenChange, subjects, subjectId, setSubjectId,
  file, setFile, loading, result, onUpload, onDownloadTemplate
}: BulkUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> বাল্ক MCQ আপলোড
          </DialogTitle>
          <DialogDescription>
            Excel ফাইল থেকে একসাথে অনেক MCQ প্রশ্ন আপলোড করুন এবং সেটে যোগ করুন
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Download className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">টেমপ্লেট ডাউনলোড করুন</p>
                    <p className="text-xs text-muted-foreground">Excel ফরম্যাটে সঠিক কলাম সহ টেমপ্লেট</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={onDownloadTemplate}>
                  <Download className="h-4 w-4" /> ডাউনলোড
                </Button>
              </div>
            </div>

            {subjects.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">বিষয় নির্বাচন (ঐচ্ছিক)</Label>
                <Select value={subjectId || 'all'} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Excel থেকে স্বয়ংক্রিয়</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Excel ফাইল আপলোড করুন</Label>
              <div
                className={cn(
                  'relative rounded-lg border-2 border-dashed transition-colors cursor-pointer',
                  file ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border hover:border-emerald-400'
                )}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.xlsx,.xls,.csv'
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement
                    const f = target.files?.[0]
                    if (f) setFile(f)
                  }
                  input.click()
                }}
              >
                <div className="p-6 text-center">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck className="h-8 w-8 text-emerald-600" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                        <X className="h-3 w-3 mr-1" /> সরান
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium">ক্লিক করে ফাইল সিলেক্ট করুন</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <p className="font-medium">আপলোড গাইডলাইন:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>প্রশ্ন, ক-ঘ ও সঠিক উত্তর আবশ্যক</li>
                      <li>সঠিক উত্তর: A, B, C বা D</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4 text-center">
                  <FileCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-600">{result.success}</p>
                  <p className="text-xs text-muted-foreground">সফল</p>
                </CardContent>
              </Card>
              <Card className={cn(result.failed > 0 ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : 'border-border/50')}>
                <CardContent className="p-4 text-center">
                  <AlertCircle className={cn('h-6 w-6 mx-auto mb-1', result.failed > 0 ? 'text-red-600' : 'text-muted-foreground')} />
                  <p className={cn('text-2xl font-bold', result.failed > 0 ? 'text-red-600' : 'text-muted-foreground')}>{result.failed}</p>
                  <p className="text-xs text-muted-foreground">ব্যর্থ</p>
                </CardContent>
              </Card>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">ত্রুটি সমূহ:</p>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-red-200 p-3 bg-red-50/50">
                  {result.errors.map((err: string, idx: number) => <p key={idx} className="text-xs text-red-600">{err}</p>)}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-3">
          {!result ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)}>বন্ধ করুন</Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onUpload} disabled={!file || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {loading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}
              </Button>
            </div>
          ) : (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenChange(false)}>সম্পন্ন</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
