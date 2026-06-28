'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from '@/components/ui/table'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'
import { ExcelParseError,safeParseExcelClient } from '@/lib/excel-parse'
import {
AlertCircle,
CheckCircle2,
ChevronDown,
Download,
FileSpreadsheet,
Loader2,
Upload,
XCircle,
} from 'lucide-react'
import React,{ useCallback,useEffect,useRef,useState } from 'react'
import * as XLSX from 'xlsx'

// ─── Types ──────────────────────────────────────────────────────

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string; classId: string }
interface ChapterItem { id: string; name: string; slug: string; subjectId: string }

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selected type: "mcq" | "cq" | "board-mcq" | "board-cq" */
  defaultType?: string
  /** Callback after successful import */
  onSuccess?: () => void
}

interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
  total: number
}

// ─── Constants ──────────────────────────────────────────────────


// ─── Component ──────────────────────────────────────────────────

export default function BulkImportDialog({
  open,
  onOpenChange,
  defaultType = 'mcq',
  onSuccess,
}: BulkImportDialogProps) {
  const { toast } = useToast()
  const { boardOptions, yearOptions } = useHierarchyMetadata()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── State ──────────────────────────────────────────────────
  const [importType, setImportType] = useState<'mcq' | 'cq'>(defaultType.startsWith('cq') ? 'cq' : 'mcq')
  const [isBoard, setIsBoard] = useState(defaultType.startsWith('board-'))
  const [file, setFile] = useState<File | null>(null)
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [board, setBoard] = useState('')
  const [year, setYear] = useState('')
  const [difficulty, setDifficulty] = useState('medium')

  // Cascade data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  // Preview data
  const [previewData, setPreviewData] = useState<Record<string, string | number | boolean | undefined>[]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])

  // Import state
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // ─── Reset state when dialog opens/closes ──────────────────
  useEffect(() => {
    if (open) {
      setImportType(defaultType.startsWith('cq') ? 'cq' : 'mcq')
      setIsBoard(defaultType.startsWith('board-'))
      setFile(null)
      setClassId('')
      setSubjectId('')
      setChapterId('')
      setBoard('')
      setYear('')
      setDifficulty('medium')
      setPreviewData([])
      setPreviewHeaders([])
      setResult(null)
      setImporting(false)
    }
  }, [open, defaultType])

  // ─── Fetch classes ──────────────────────────────────────────
  useEffect(() => {
    if (open) {
      fetch('/api/admin/classes')
        .then((res) => res.json())
        .then((json) => setClasses(Array.isArray(json.data) ? json.data : []))
        .catch(() => {})
    }
  }, [open])

  // ─── Cascade: classId → subjects ────────────────────────────
  useEffect(() => {
    if (classId) {
      fetch(`/api/admin/subjects?classId=${classId}`)
        .then((res) => res.json())
        .then((json) => setSubjects(Array.isArray(json.data) ? json.data : []))
        .catch(() => {})
      setSubjectId('')
      setChapterId('')
    } else {
      setSubjects([])
      setChapters([])
    }
  }, [classId])

  // ─── Cascade: subjectId → chapters ──────────────────────────
  useEffect(() => {
    if (subjectId) {
      fetch(`/api/admin/chapters?subjectId=${subjectId}`)
        .then((res) => res.json())
        .then((json) => setChapters(Array.isArray(json.data) ? json.data : []))
        .catch(() => {})
      setChapterId('')
    } else {
      setChapters([])
    }
  }, [subjectId])

  // ─── Parse file for preview ─────────────────────────────────
  const parseFile = useCallback(async (f: File) => {
    try {
      const { rows } = await safeParseExcelClient(f)

      if (rows.length === 0) {
        toast({ title: 'ত্রুটি', description: 'ফাইলে কোনো ডেটা নেই', variant: 'destructive' })
        return
      }

      const headers = Object.keys(rows[0])
      setPreviewHeaders(headers)
      setPreviewData(rows.slice(0, 20)) // Show first 20 rows
    } catch (err) {
      const msg = err instanceof ExcelParseError ? err.message : 'ফাইল পড়তে সমস্যা হয়েছে'
      toast({ title: 'ত্রুটি', description: msg, variant: 'destructive' })
    }
  }, [toast])

  // ─── Handle file selection ──────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ]
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(ext)) {
        toast({ title: 'ত্রুটি', description: 'শুধুমাত্র .xlsx, .xls, .csv ফাইল সমর্থিত', variant: 'destructive' })
        return
      }

      setFile(selectedFile)
      setResult(null)
      parseFile(selectedFile)
    }
  }

  // ─── Handle drag & drop ─────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResult(null)
      parseFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // ─── Generate demo file ─────────────────────────────────────
  const downloadDemoFile = () => {
    let data: Record<string, string | number | boolean>[]
    let filename: string

    if (importType === 'mcq') {
      data = [
        {
          question: 'বাংলাদেশের রাজধানী কোনটি?',
          optionA: 'ঢাকা',
          optionB: 'চট্টগ্রাম',
          optionC: 'রাজশাহী',
          optionD: 'খুলনা',
          correctAnswer: 'A',
          explanation: 'বাংলাদেশের রাজধানী ঢাকা।',
          topic: 'ভূগোল',
          isPremium: 'false',
          price: 0,
        },
        {
          question: 'পানির রাসায়নিক সংকেত কী?',
          optionA: 'H2O',
          optionB: 'CO2',
          optionC: 'NaCl',
          optionD: 'O2',
          correctAnswer: 'A',
          explanation: 'পানির রাসায়নিক সংকেত H₂O।',
          topic: 'রসায়ন',
          isPremium: 'false',
          price: 0,
        },
        {
          question: '২ + ৩ = ?',
          optionA: '৪',
          optionB: '৫',
          optionC: '৬',
          optionD: '৭',
          correctAnswer: 'B',
          explanation: '২ + ৩ = ৫',
          topic: 'গণিত',
          isPremium: 'true',
          price: 10,
        },
      ]
      filename = 'MCQ_ডেমো_টেমপ্লেট.xlsx'
    } else {
      data = [
        {
          uddeepok: 'একটি ত্রিভুজের তিনটি কোণের মান যথাক্রমে ৬০°, ৬০° এবং ৬০°।',
          question1: 'ত্রিভুজটি কী ধরনের ত্রিভুজ?',
          answer1: 'সমবাহু ত্রিভুজ। কারণ তিনটি কোণই সমান।',
          question2: 'ত্রিভুজের কোণগুলোর যোগফল কত?',
          answer2: '১৮০°। যেকোনো ত্রিভুজের তিনটি অন্তঃকোণের যোগফল ১৮০°।',
          question3: 'এই ত্রিভুজের বাহুগুলোর মধ্যে সম্পর্ক কী?',
          answer3: 'তিনটি বাহুই পরস্পর সমান।',
          question4: '',
          answer4: '',
          topic: 'জ্যামিতি',
          isPremium: 'false',
          price: 0,
        },
        {
          uddeepok: 'একটি বৃত্তের ব্যাসার্ধ ৭ সে.মি.।',
          question1: 'বৃত্তের পরিধি নির্ণয় করুন।',
          answer1: 'পরিধি = ২πr = ২ × ২২/৭ × ৭ = ৪৪ সে.মি.',
          question2: 'বৃত্তের ক্ষেত্রফল নির্ণয় করুন।',
          answer2: 'ক্ষেত্রফল = πr² = ২২/৭ × ৭² = ১৫৪ বর্গ সে.মি.',
          question3: '',
          answer3: '',
          question4: '',
          answer4: '',
          topic: 'জ্যামিতি',
          isPremium: 'true',
          price: 15,
        },
      ]
      filename = 'CQ_ডেমো_টেমপ্লেট.xlsx'
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Questions')

    // Set column widths
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length * 2, 20),
    }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, filename)
  }

  // ─── Handle import ──────────────────────────────────────────
  const handleImport = async () => {
    if (!file) {
      toast({ title: 'ত্রুটি', description: 'ফাইল নির্বাচন করুন', variant: 'destructive' })
      return
    }
    if (!classId || !subjectId || !chapterId) {
      toast({ title: 'ত্রুটি', description: 'ক্লাস, বিষয় ও অধ্যায় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    if (isBoard && !board) {
      toast({ title: 'ত্রুটি', description: 'বোর্ড প্রশ্নের জন্য বোর্ড আবশ্যক', variant: 'destructive' })
      return
    }
    if (isBoard && !year) {
      toast({ title: 'ত্রুটি', description: 'বোর্ড প্রশ্নের জন্য সাল আবশ্যক', variant: 'destructive' })
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const typeValue = isBoard ? `board-${importType}` : importType
      formData.append('type', typeValue)
      formData.append('classId', classId)
      formData.append('subjectId', subjectId)
      formData.append('chapterId', chapterId)
      if (board) formData.append('board', board)
      if (year) formData.append('year', year)
      formData.append('difficulty', difficulty)

      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (res.ok) {
        setResult(json)
        if (json.success > 0) {
          toast({
            title: 'ইম্পোর্ট সফল',
            description: `${json.success}টি প্রশ্ন সফলভাবে ইম্পোর্ট হয়েছে`,
          })
          onSuccess?.()
        }
      } else {
        toast({
          title: 'ত্রুটি',
          description: json.error || 'ইম্পোর্ট করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  // ─── Validation ─────────────────────────────────────────────
  const canImport = !!(
    file &&
    classId &&
    subjectId &&
    chapterId &&
    (!isBoard || (board && year)) &&
    !importing
  )

  // ─── Shorten text for preview table ─────────────────────────
  const truncate = (text: string, maxLen = 40) => {
    if (!text) return ''
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-5 w-5 text-emerald-600" />
            বাল্ক ইম্পোর্ট
          </DialogTitle>
          <DialogDescription>
            Excel বা CSV ফাইল থেকে একসাথে একাধিক প্রশ্ন ইম্পোর্ট করুন
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ─── Type Selection ────────────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">প্রশ্নের ধরন</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setImportType('mcq'); setResult(null) }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  importType === 'mcq'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-border hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    importType === 'mcq' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    M
                  </div>
                  <span className="font-semibold">MCQ</span>
                </div>
                <p className="text-xs text-muted-foreground">বহুনির্বাচনী প্রশ্ন</p>
              </button>

              <button
                type="button"
                onClick={() => { setImportType('cq'); setResult(null) }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  importType === 'cq'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-border hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    importType === 'cq' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    C
                  </div>
                  <span className="font-semibold">CQ</span>
                </div>
                <p className="text-xs text-muted-foreground">সৃজনশীল প্রশ্ন</p>
              </button>
            </div>

            {/* Board toggle */}
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBoard}
                  onChange={(e) => { setIsBoard(e.target.checked); setResult(null) }}
                  className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium">বোর্ড প্রশ্ন হিসেবে ইম্পোর্ট</span>
              </label>
            </div>
          </div>

          {/* ─── Cascade Selects ───────────────────────────────── */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ChevronDown className="h-4 w-4 text-emerald-600" />
                <Label className="text-sm font-semibold">হায়ারার্কি নির্বাচন</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Class */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    ক্লাস <span className="text-destructive">*</span>
                  </Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="ক্লাস নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    বিষয় <span className="text-destructive">*</span>
                  </Label>
                  <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                    <SelectTrigger>
                      <SelectValue placeholder="বিষয় নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chapter */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    অধ্যায় <span className="text-destructive">*</span>
                  </Label>
                  <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="অধ্যায় নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Board, Year, Difficulty row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Board */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    বোর্ড {isBoard && <span className="text-destructive">*</span>}
                  </Label>
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger>
                      <SelectValue placeholder="বোর্ড নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {boardOptions.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    সাল {isBoard && <span className="text-destructive">*</span>}
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="সাল নির্বাচন" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">কঠিনতা</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">সহজ</SelectItem>
                      <SelectItem value="medium">মাঝারি</SelectItem>
                      <SelectItem value="hard">কঠিন</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── File Upload Area ───────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">ফাইল আপলোড</Label>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={downloadDemoFile}
              >
                <Download className="h-3.5 w-3.5" />
                ডেমো ফাইল ডাউনলোড
              </Button>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                file
                  ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
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
                <div className="space-y-2">
                  <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreviewData([])
                      setPreviewHeaders([])
                      setResult(null)
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    ফাইল সরান
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    ফাইল এখানে ড্রপ করুন অথবা ক্লিক করুন
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .xlsx, .xls, .csv ফাইল সমর্থিত
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Preview Table ──────────────────────────────────── */}
          {previewData.length > 0 && !result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  ডেটা প্রিভিউ
                </Label>
                <Badge variant="outline" className="text-xs">
                  প্রথম {Math.min(previewData.length, 20)}টি সারি দেখানো হচ্ছে
                </Badge>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-x-auto overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10 text-xs font-semibold">#</TableHead>
                        {previewHeaders.map((h) => (
                          <TableHead key={h} className="text-xs font-semibold whitespace-nowrap min-w-[120px]">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs text-muted-foreground font-mono">
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
              </div>
            </div>
          )}

          {/* ─── Import Results ─────────────────────────────────── */}
          {result && (
            <Card className={`border-2 ${result.errors.length > 0 ? 'border-amber-300' : 'border-emerald-300'}`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  {result.errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <Label className="text-sm font-semibold">ইম্পোর্ট ফলাফল</Label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-xs text-muted-foreground">মোট সারি</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <p className="text-2xl font-bold text-emerald-600">{result.success}</p>
                    <p className="text-xs text-muted-foreground">সফল</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                    <p className="text-xs text-muted-foreground">ত্রুটি</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      ত্রুটির বিবরণ:
                    </Label>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/20">
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                            সারি {err.row}
                          </Badge>
                          <span className="text-amber-800 dark:text-amber-200">{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Expected Format Info ───────────────────────────── */}
          {!file && !result && (
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">প্রত্যাশিত কলাম ফরম্যাট:</p>
                    {importType === 'mcq' ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span><Badge variant="outline" className="text-[10px] mr-1">আবশ্যক</Badge> question, optionA-D, correctAnswer</span>
                        <span><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> explanation, topic, isPremium, price</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span><Badge variant="outline" className="text-[10px] mr-1">আবশ্যক</Badge> uddeepok, question1, answer1</span>
                        <span><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> question2-4, answer2-4, topic, isPremium, price</span>
                      </div>
                    )}
                    <p>সঠিক উত্তর: A/B/C/D অথবা ক/খ/গ/ঘ ব্যবহার করুন</p>
                    <p>isPremium: true/false অথবা 1/0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                বাতিল
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                disabled={!canImport}
                onClick={handleImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ইম্পোর্ট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    ইম্পোর্ট শুরু করুন
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                বন্ধ করুন
              </Button>
              {result.errors.length > 0 && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setResult(null)}
                >
                  আবার চেষ্টা করুন
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
