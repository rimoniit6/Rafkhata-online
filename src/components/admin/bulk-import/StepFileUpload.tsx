import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { AlertCircle, Check, Download, FileSpreadsheet, Trash2, Upload, XCircle } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'


export function StepFileUpload({
  file,
  setFile,
  previewData,
  setPreviewData,
  previewHeaders,
  setPreviewHeaders,
  allRows,
  setAllRows,
  setResult,
  fileInputRef,
  handleDrop,
  handleDragOver,
  handleFileChange,
  downloadDemoFile,
  columnValidation,
  truncate,
}: {
  file: File | null
  setFile: (v: File | null) => void
  previewData: Record<string, string | number | boolean | undefined>[]
  setPreviewData: (v: Record<string, string | number | boolean | undefined>[]) => void
  previewHeaders: string[]
  setPreviewHeaders: (v: string[]) => void
  allRows: Record<string, string | number | boolean | undefined>[]
  setAllRows: (v: Record<string, string | number | boolean | undefined>[]) => void
  setResult: (v: null) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  downloadDemoFile: () => void
  columnValidation: {
    missing: string[]
    found: string[]
    foundOptional: string[]
    unknown: string[]
  } | null
  truncate: (text: string, maxLen?: number) => string
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">ফাইল আপলোড</CardTitle>
              <CardDescription>Excel বা CSV ফাইল আপলোড করুন — প্রথম ২০টি সারি প্রিভিউ দেখানো হবে</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={downloadDemoFile}
            >
              <Download className="h-3.5 w-3.5" />
              ডেমো ফাইল
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer',
              file
                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-border hover:border-emerald-400 hover:bg-emerald-50/20'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB • {allRows.length}টি সারি
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setPreviewData([])
                    setPreviewHeaders([])
                    setAllRows([])
                    setResult(null)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  ফাইল সরান
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ফাইল এখানে ড্রপ করুন অথবা ক্লিক করুন
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    .xlsx, .xls, .csv ফাইল সমর্থিত
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {columnValidation && file && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">কলাম যাচাইকরণ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {columnValidation.found.map((col) => (
                <Badge key={col} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 gap-1">
                  <Check className="h-3 w-3" /> {col}
                </Badge>
              ))}
              {columnValidation.foundOptional.map((col) => (
                <Badge key={col} variant="outline" className="gap-1">
                  <Check className="h-3 w-3" /> {col}
                </Badge>
              ))}
              {columnValidation.missing.map((col) => (
                <Badge key={col} variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {col}
                </Badge>
              ))}
              {columnValidation.unknown.map((col) => (
                <Badge key={col} variant="outline" className="text-muted-foreground gap-1">
                  <AlertCircle className="h-3 w-3" /> {col}
                </Badge>
              ))}
            </div>
            {columnValidation.missing.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 dark:text-red-400">
                  <p className="font-semibold">আবশ্যক কলাম নেই!</p>
                  <p className="mt-1">ফাইলে {columnValidation.missing.join(', ')} কলাম পাওয়া যায়নি। ডেমো ফাইল ডাউনলোড করে ফরম্যাট দেখুন।</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {previewData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">ডেটা প্রিভিউ</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  মোট {allRows.length}টি সারি
                </Badge>
                <Badge variant="outline" className="text-xs">
                  প্রথম {Math.min(previewData.length, 20)}টি দেখাচ্ছে
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-x-auto overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-xs font-bold sticky left-0 bg-muted/50">#</TableHead>
                    {previewHeaders.map((h) => (
                      <TableHead key={h} className="text-xs font-bold whitespace-nowrap min-w-[130px]">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground font-mono sticky left-0 bg-background">
                        {idx + 1}
                      </TableCell>
                      {previewHeaders.map((h) => (
                        <TableCell key={h} className="text-xs max-w-[200px] truncate">
                          {truncate(String(row[h] ?? ''))}
                        </TableCell>
                      ))}
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
