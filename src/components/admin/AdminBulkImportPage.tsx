'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ExcelParseError,safeParseExcelClient } from '@/lib/excel-parse'
import { cn } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertCircle,
AlignLeft,
ArrowLeft,
Check,
CheckCircle2,
ChevronRight,
Clock,
Database,
Download,
FileQuestion,
FileSpreadsheet,
Info,
Layers,
Loader2,
RotateCcw,
Trash2,
Upload,
XCircle
} from 'lucide-react'
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string; classId: string }
interface ChapterItem { id: string; name: string; slug: string; subjectId: string }
interface BoardItem { id: string; name: string; slug: string }
interface YearItem { id: string; year: string }

interface HierarchyMetadata {
  classes: ClassItem[]
  subjects: SubjectItem[]
  chapters: ChapterItem[]
  boards: BoardItem[]
  years: YearItem[]
  boardYears: { id: string; board: string; year: string }[]
}

interface ImportResult {
  success: number
  errors: { row: number; message: string }[]
  total: number
}

interface ImportHistoryItem {
  id: string
  type: 'mcq' | 'cq'
  isBoard: boolean
  fileName: string
  totalRows: number
  successCount: number
  errorCount: number
  timestamp: Date
}

type Step = 1 | 2 | 3 | 4

// ─── Step indicator ─────────────────────────────────────────────

function StepIndicator({ step, currentStep, label, icon: Icon }: {
  step: Step
  currentStep: Step
  label: string
  icon: React.ElementType
}) {
  const isCompleted = currentStep > step
  const isCurrent = currentStep === step

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0',
        isCompleted && 'bg-emerald-600 text-white',
        isCurrent && 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
      )}>
        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <span className={cn(
        'text-xs font-medium hidden sm:block',
        isCurrent && 'text-emerald-700 dark:text-emerald-400',
        isCompleted && 'text-emerald-600',
        !isCompleted && !isCurrent && 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminBulkImportPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Step State ────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>(1)

  // ─── Form State ────────────────────────────────────────────
  const [importType, setImportType] = useState<'mcq' | 'cq'>('mcq')
  const [isBoard, setIsBoard] = useState(false)
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [board, setBoard] = useState('')
  const [year, setYear] = useState('')
  const [difficulty, setDifficulty] = useState('medium')

  // Metadata from hierarchy
  const [metadata, setMetadata] = useState<HierarchyMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(true)

  // Cascade data (filtered from metadata)
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  // File & preview data
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string | number | boolean | undefined>[]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const [allRows, setAllRows] = useState<Record<string, string | number | boolean | undefined>[]>([])

  // Import state
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [])

  // History
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])

  // ─── Fetch metadata from hierarchy (central database) ───────
  useEffect(() => {
    const fetchMetadata = async () => {
      setMetadataLoading(true)
      try {
        const res = await fetch('/api/hierarchy/metadata')
        const json = await res.json()
        if (json.success && json.data) {
          setMetadata(json.data)
        } else {
          toast({ title: 'ত্রুটি', description: 'মেটাডাটা লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
      } finally {
        setMetadataLoading(false)
      }
    }
    fetchMetadata()
  }, [toast])

  // ─── Cascade: classId → subjects ────────────────────────────
  useEffect(() => {
    if (classId && metadata) {
      const filtered = metadata.subjects.filter((s) => s.classId === classId)
      setSubjects(filtered)
      setSubjectId('')
      setChapterId('')
    } else {
      setSubjects([])
      setChapters([])
    }
  }, [classId, metadata])

  // ─── Cascade: subjectId → chapters ──────────────────────────
  useEffect(() => {
    if (subjectId && metadata) {
      const filtered = metadata.chapters.filter((c) => c.subjectId === subjectId)
      setChapters(filtered)
      setChapterId('')
    } else {
      setChapters([])
    }
  }, [subjectId, metadata])

  // ─── Derived data ──────────────────────────────────────────
  const availableYears = useMemo(() => metadata?.years?.map((y) => y.year) || [], [metadata])
  const availableBoards = useMemo(() => metadata?.boards || [], [metadata])

  const selectedClassName = useMemo(() => {
    return metadata?.classes.find((c) => c.id === classId)?.name || ''
  }, [metadata, classId])

  const selectedSubjectName = useMemo(() => {
    return subjects.find((s) => s.id === subjectId)?.name || ''
  }, [subjects, subjectId])

  const selectedChapterName = useMemo(() => {
    return chapters.find((c) => c.id === chapterId)?.name || ''
  }, [chapters, chapterId])

  const selectedBoardName = useMemo(() => {
    return availableBoards.find((b) => b.slug === board)?.name || ''
  }, [availableBoards, board])

  // ─── Step validation ────────────────────────────────────────
  const step1Valid = !!(importType)
  const step2Valid = !!(classId && subjectId && chapterId && (!isBoard || (board && year)))
  const step3Valid = !!(file && previewData.length > 0)

  const canGoNext = currentStep === 1 ? step1Valid : currentStep === 2 ? step2Valid : currentStep === 3 ? step3Valid : false

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
      setPreviewData(rows.slice(0, 20))
      setAllRows(rows)
    } catch (err) {
      const msg = err instanceof ExcelParseError ? err.message : 'ফাইল পড়তে সমস্যা হয়েছে'
      toast({ title: 'ত্রুটি', description: msg, variant: 'destructive' })
    }
  }, [toast])

  // ─── Handle file selection ──────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()

      if (!validExtensions.includes(ext)) {
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
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResult(null)
      parseFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // ─── Generate demo file ─────────────────────────────────────
  const downloadDemoFile = async () => {
    const XLSX = await import('xlsx')
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
          question3: '',
          answer3: '',
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

    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length * 2, 20),
    }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, filename)
  }

  // ─── Handle import ──────────────────────────────────────────
  const handleImport = async () => {
    if (!file || !classId || !subjectId || !chapterId) return

    setImporting(true)
    setResult(null)
    setImportProgress(0)

    // Simulate progress
    progressIntervalRef.current = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + Math.random() * 15, 90))
    }, 300)

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
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      setImportProgress(100)

      if (res.ok) {
        setResult(json)
        // Add to history
        const historyItem: ImportHistoryItem = {
          id: Date.now().toString(),
          type: importType,
          isBoard,
          fileName: file.name,
          totalRows: json.total,
          successCount: json.success,
          errorCount: json.errors?.length || 0,
          timestamp: new Date(),
        }
        setImportHistory((prev) => [historyItem, ...prev])

        if (json.success > 0) {
          toast({
            title: 'ইম্পোর্ট সফল!',
            description: `${json.success}টি প্রশ্ন সফলভাবে ইম্পোর্ট হয়েছে`,
          })
        }
        setCurrentStep(4)
      } else {
        toast({
          title: 'ত্রুটি',
          description: json.error || 'ইম্পোর্ট করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
        setImportProgress(0)
      }
    } catch {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
      setImportProgress(0)
    } finally {
      setImporting(false)
    }
  }

  // ─── Reset everything ──────────────────────────────────────
  const resetAll = () => {
    setCurrentStep(1)
    setImportType('mcq')
    setIsBoard(false)
    setClassId('')
    setSubjectId('')
    setChapterId('')
    setBoard('')
    setYear('')
    setDifficulty('medium')
    setFile(null)
    setPreviewData([])
    setPreviewHeaders([])
    setAllRows([])
    setResult(null)
    setImportProgress(0)
    setImporting(false)
  }

  // ─── Shorten text ──────────────────────────────────────────
  const truncate = (text: string, maxLen = 40) => {
    if (!text) return ''
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

  // ─── Validate columns ──────────────────────────────────────
  const columnValidation = useMemo(() => {
    if (!previewHeaders.length || !importType) return null

    const requiredMCQ = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer']
    const requiredCQ = ['uddeepok', 'question1', 'answer1']
    const optionalMCQ = ['explanation', 'topic', 'isPremium', 'price']
    const optionalCQ = ['question2', 'question3', 'question4', 'answer2', 'answer3', 'answer4', 'topic', 'isPremium', 'price']

    const required = importType === 'mcq' ? requiredMCQ : requiredCQ
    const optional = importType === 'mcq' ? optionalMCQ : optionalCQ

    const missing = required.filter((col) =>
      !previewHeaders.some((h) => h.toLowerCase().replace(/\s/g, '') === col.toLowerCase().replace(/\s/g, ''))
    )
    const found = required.filter((col) =>
      previewHeaders.some((h) => h.toLowerCase().replace(/\s/g, '') === col.toLowerCase().replace(/\s/g, ''))
    )
    const foundOptional = optional.filter((col) =>
      previewHeaders.some((h) => h.toLowerCase().replace(/\s/g, '') === col.toLowerCase().replace(/\s/g, ''))
    )
    const unknown = previewHeaders.filter((h) =>
      !required.some((c) => c.toLowerCase().replace(/\s/g, '') === h.toLowerCase().replace(/\s/g, '')) &&
      !optional.some((c) => c.toLowerCase().replace(/\s/g, '') === h.toLowerCase().replace(/\s/g, ''))
    )

    return { missing, found, foundOptional, unknown }
  }, [previewHeaders, importType])

  // ─── Loading state ──────────────────────────────────────────
  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
            <Database className="h-5 w-5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">হায়ারার্কি থেকে মেটাডাটা লোড হচ্ছে</p>
            <p className="text-xs text-muted-foreground mt-1">ক্লাস, বিষয়, অধ্যায়, বোর্ড, সাল...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('admin-dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Upload className="h-6 w-6 text-emerald-600" />
              বাল্ক ইম্পোর্ট
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Excel/CSV থেকে একসাথে প্রশ্ন ইম্পোর্ট • মেটাডাটা হায়ারার্কি থেকে আসছে
            </p>
          </div>
        </div>
        {importHistory.length > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {importHistory.length}টি ইম্পোর্ট সেশন
          </Badge>
        )}
      </div>

      {/* ─── Step Progress Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 bg-card border rounded-xl p-4">
        <div className="flex items-center gap-1 sm:gap-3 flex-1">
          <StepIndicator step={1} currentStep={currentStep} label="ধরন নির্বাচন" icon={FileQuestion} />
          <div className={cn('h-px flex-1 min-w-[20px]', currentStep > 1 ? 'bg-emerald-400' : 'bg-border')} />
          <StepIndicator step={2} currentStep={currentStep} label="হায়ারার্কি" icon={Layers} />
          <div className={cn('h-px flex-1 min-w-[20px]', currentStep > 2 ? 'bg-emerald-400' : 'bg-border')} />
          <StepIndicator step={3} currentStep={currentStep} label="ফাইল আপলোড" icon={Upload} />
          <div className={cn('h-px flex-1 min-w-[20px]', currentStep > 3 ? 'bg-emerald-400' : 'bg-border')} />
          <StepIndicator step={4} currentStep={currentStep} label="ফলাফল" icon={CheckCircle2} />
        </div>
      </div>

      {/* ─── Step Content ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >

          {/* ══════ STEP 1: Type Selection ══════ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">প্রশ্নের ধরন নির্বাচন করুন</CardTitle>
                  <CardDescription>আপনি কোন ধরনের প্রশ্ন ইম্পোর্ট করতে চান?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setImportType('mcq')}
                      className={cn(
                        'relative p-6 rounded-xl border-2 text-left transition-all group',
                        importType === 'mcq'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md shadow-emerald-100 dark:shadow-emerald-950/50'
                          : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
                      )}
                    >
                      {importType === 'mcq' && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                          importType === 'mcq'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                            : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-700'
                        )}>
                          <FileQuestion className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">MCQ</h3>
                          <p className="text-xs text-muted-foreground">বহুনির্বাচনী প্রশ্ন</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        ৪টি অপশন সহ বহুনির্বাচনী প্রশ্ন। প্রশ্ন, অপশন A-D, সঠিক উত্তর আবশ্যক।
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportType('cq')}
                      className={cn(
                        'relative p-6 rounded-xl border-2 text-left transition-all group',
                        importType === 'cq'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md shadow-emerald-100 dark:shadow-emerald-950/50'
                          : 'border-border hover:border-emerald-300 hover:bg-emerald-50/30'
                      )}
                    >
                      {importType === 'cq' && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                          importType === 'cq'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900'
                            : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-700'
                        )}>
                          <AlignLeft className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">CQ</h3>
                          <p className="text-xs text-muted-foreground">সৃজনশীল প্রশ্ন</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        উদ্দীপক সহ সৃজনশীল প্রশ্ন। উদ্দীপক, প্রশ্ন ১ ও উত্তর ১ আবশ্যক।
                      </p>
                    </button>
                  </div>

                  {/* Board toggle */}
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        isBoard ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-muted text-muted-foreground'
                      )}>
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">বোর্ড প্রশ্ন হিসেবে ইম্পোর্ট</p>
                        <p className="text-xs text-muted-foreground">বোর্ড ও সাল নির্বাচন আবশ্যক হবে</p>
                      </div>
                    </div>
                    <Switch
                      checked={isBoard}
                      onCheckedChange={(checked) => { setIsBoard(checked); setResult(null) }}
                    />
                  </div>

                  {/* Format info */}
                  <Card className="border-border/50 bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">কলাম ফরম্যাট:</p>
                          {importType === 'mcq' ? (
                            <div className="space-y-1">
                              <p><Badge variant="outline" className="text-[10px] mr-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">আবশ্যক</Badge> question, optionA, optionB, optionC, optionD, correctAnswer</p>
                              <p><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> explanation, topic, isPremium, price</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p><Badge variant="outline" className="text-[10px] mr-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">আবশ্যক</Badge> uddeepok, question1, answer1</p>
                              <p><Badge variant="outline" className="text-[10px] mr-1">ঐচ্ছিক</Badge> question2-4, answer2-4, topic, isPremium, price</p>
                            </div>
                          )}
                          <p>সঠিক উত্তর: A/B/C/D অথবা ক/খ/গ/ঘ ব্যবহার করুন</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════ STEP 2: Hierarchy Selection ══════ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-lg">হায়ারার্কি নির্বাচন</CardTitle>
                    <Badge variant="outline" className="text-[10px] ml-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      হায়ারার্কি থেকে
                    </Badge>
                  </div>
                  <CardDescription>ক্লাস → বিষয় → অধ্যায় নির্বাচন করুন — সব তথ্য হায়ারার্কি ব্যবস্থাপনা থেকে আসছে</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Class → Subject → Chapter cascade */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Class */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        ক্লাস <span className="text-destructive">*</span>
                      </Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata?.classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {classId && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> {selectedClassName}
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        বিষয় <span className="text-destructive">*</span>
                      </Label>
                      <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={classId ? 'বিষয় নির্বাচন' : 'আগে ক্লাস নির্বাচন করুন'} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {subjectId && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> {selectedSubjectName}
                        </p>
                      )}
                    </div>

                    {/* Chapter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        অধ্যায় <span className="text-destructive">*</span>
                      </Label>
                      <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={subjectId ? 'অধ্যায় নির্বাচন' : 'আগে বিষয় নির্বাচন করুন'} />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((ch) => (
                            <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {chapterId && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> {selectedChapterName}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Board, Year, Difficulty */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Board */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        বোর্ড
                        {isBoard && <span className="text-destructive">*</span>}
                        <Badge variant="outline" className="text-[9px] ml-1">হায়ারার্কি</Badge>
                      </Label>
                      <Select value={board} onValueChange={setBoard}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="বোর্ড নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBoards.map((b) => (
                            <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {board && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> {selectedBoardName}
                        </p>
                      )}
                    </div>

                    {/* Year - TEXT INPUT */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-1">
                        সাল
                        {isBoard && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        type="text"
                        placeholder="সাল লিখুন (যেমন: ২০২৫)"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-11"
                      />
                      {availableYears.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          হায়ারার্কিতে থাকা সাল: {availableYears.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">কঠিনতা</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🟢 সহজ</SelectItem>
                          <SelectItem value="medium">🟡 মাঝারি</SelectItem>
                          <SelectItem value="hard">🔴 কঠিন</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selection Summary */}
                  {step2Valid && (
                    <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">নির্বাচন সম্পূর্ণ</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="bg-white dark:bg-background">{selectedClassName}</Badge>
                          <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                          <Badge variant="outline" className="bg-white dark:bg-background">{selectedSubjectName}</Badge>
                          <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                          <Badge variant="outline" className="bg-white dark:bg-background">{selectedChapterName}</Badge>
                          {isBoard && board && (
                            <>
                              <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                              <Badge variant="outline" className="bg-white dark:bg-background">{selectedBoardName}</Badge>
                              <ChevronRight className="h-3 w-3 text-muted-foreground self-center" />
                              <Badge variant="outline" className="bg-white dark:bg-background">সাল: {year}</Badge>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════ STEP 3: File Upload & Preview ══════ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* File Upload Card */}
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

              {/* Column Validation */}
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

              {/* Preview Table */}
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
          )}

          {/* ══════ STEP 4: Results ══════ */}
          {currentStep === 4 && result && (
            <div className="space-y-6">
              {/* Import Progress */}
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

              {/* Result Summary */}
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

                  {/* Error details */}
                  {result.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        ত্রুটির বিবরণ ({result.errors.length}টি)
                      </Label>
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

                  {/* Import details */}
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

              {/* History */}
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
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Import in progress overlay ───────────────────────── */}
      {importing && currentStep === 3 && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
                <Upload className="h-6 w-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">ইম্পোর্ট হচ্ছে...</p>
                <p className="text-sm text-muted-foreground mt-1">{allRows.length}টি সারি প্রসেস হচ্ছে</p>
              </div>
              <Progress value={importProgress} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">{Math.round(importProgress)}% সম্পন্ন</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Bottom Navigation ────────────────────────────────── */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-2 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && currentStep < 4 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                পেছনে
              </Button>
            )}
            {currentStep === 1 && (
              <Button
                variant="outline"
                onClick={() => navigate('admin-dashboard')}
              >
                বাতিল
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < 3 && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                disabled={!canGoNext}
                onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
              >
                পরবর্তী ধাপ
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                disabled={!step3Valid || importing || (columnValidation?.missing?.length ?? 0) > 0}
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
                    ইম্পোর্ট শুরু করুন ({allRows.length}টি)
                  </>
                )}
              </Button>
            )}

            {currentStep === 4 && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={resetAll}
                >
                  <RotateCcw className="h-4 w-4" />
                  আরও ইম্পোর্ট
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={() => navigate('admin-mcq')}
                >
                  MCQ তালিকায় যান
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
