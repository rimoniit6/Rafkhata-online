'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'
import { ExcelParseError,safeParseExcelClient } from '@/lib/excel-parse'
import { cn } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
ArrowLeft,
CheckCircle2,
ChevronRight,
Clock,
Database,
FileQuestion,
Layers,
Loader2,
RotateCcw,
Upload
} from 'lucide-react'
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react'

import { bulkImportService } from '@/services/api/bulk-import.service'
import type { ImportResult,ImportHistoryItem,Step } from './bulk-import/types'
import { StepIndicator } from './bulk-import/StepIndicator'
import { StepTypeSelection } from './bulk-import/StepTypeSelection'
import { StepHierarchy } from './bulk-import/StepHierarchy'
import { StepFileUpload } from './bulk-import/StepFileUpload'
import { StepResults } from './bulk-import/StepResults'

export default function AdminBulkImportPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<Step>(1)

  const [importType, setImportType] = useState<'mcq' | 'cq'>('mcq')
  const [isBoard, setIsBoard] = useState(false)
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [board, setBoard] = useState('')
  const [year, setYear] = useState('')
  const [difficulty, setDifficulty] = useState('medium')

  const { metadata, loading: metadataLoading, subjects: allSubjects, chapters: allChapters, boardOptions, yearOptions } = useHierarchyMetadata()

  const subjects = useMemo(() => {
    if (!classId) return allSubjects
    return allSubjects.filter((s) => s.classId === classId)
  }, [classId, allSubjects])

  const chapters = useMemo(() => {
    if (!subjectId) return allChapters
    return allChapters.filter((c) => c.subjectId === subjectId)
  }, [subjectId, allChapters])

  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string | number | boolean | undefined>[]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const [allRows, setAllRows] = useState<Record<string, string | number | boolean | undefined>[]>([])

  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [])

  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])

  const availableYears = useMemo(() => yearOptions?.map((y) => y.value) || [], [yearOptions])
  const availableBoards = useMemo(() => boardOptions || [], [boardOptions])

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
    return availableBoards.find((b) => b.value === board)?.label || ''
  }, [availableBoards, board])

  const step1Valid = !!(importType)
  const step2Valid = !!(classId && subjectId && chapterId && (!isBoard || (board && year)))
  const step3Valid = !!(file && previewData.length > 0)

  const canGoNext = currentStep === 1 ? step1Valid : currentStep === 2 ? step2Valid : currentStep === 3 ? step3Valid : false

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

  const handleImport = async () => {
    if (!file || !classId || !subjectId || !chapterId) return

    setImporting(true)
    setResult(null)
    setImportProgress(0)

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

      const data = await bulkImportService.import(formData)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      setImportProgress(100)

      setResult(data)
      const historyItem: ImportHistoryItem = {
        id: Date.now().toString(),
        type: importType,
        isBoard,
        fileName: file.name,
        totalRows: data.total,
        successCount: data.success,
        errorCount: data.errors?.length || 0,
        timestamp: new Date(),
      }
      setImportHistory((prev) => [historyItem, ...prev])

      if (data.success > 0) {
        toast({
          title: 'ইম্পোর্ট সফল!',
          description: `${data.success}টি প্রশ্ন সফলভাবে ইম্পোর্ট হয়েছে`,
        })
      }
      setCurrentStep(4)
    } catch {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
      setImportProgress(0)
    } finally {
      setImporting(false)
    }
  }

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

  const truncate = (text: string, maxLen = 40) => {
    if (!text) return ''
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
  }

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

  return (
    <div className="space-y-6">
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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <StepTypeSelection
              importType={importType}
              setImportType={setImportType}
              isBoard={isBoard}
              setIsBoard={setIsBoard}
              setResult={setResult}
            />
          )}

          {currentStep === 2 && (
            <StepHierarchy
              classId={classId} setClassId={setClassId}
              subjectId={subjectId} setSubjectId={setSubjectId}
              chapterId={chapterId} setChapterId={setChapterId}
              board={board} setBoard={setBoard}
              year={year} setYear={setYear}
              difficulty={difficulty} setDifficulty={setDifficulty}
              isBoard={isBoard}
              metadata={metadata}
              subjects={subjects}
              chapters={chapters}
              availableBoards={availableBoards}
              availableYears={availableYears}
              selectedClassName={selectedClassName}
              selectedSubjectName={selectedSubjectName}
              selectedChapterName={selectedChapterName}
              selectedBoardName={selectedBoardName}
              step2Valid={step2Valid}
            />
          )}

          {currentStep === 3 && (
            <StepFileUpload
              file={file} setFile={setFile}
              previewData={previewData} setPreviewData={setPreviewData}
              previewHeaders={previewHeaders} setPreviewHeaders={setPreviewHeaders}
              allRows={allRows} setAllRows={setAllRows}
              setResult={setResult}
              fileInputRef={fileInputRef}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleFileChange={handleFileChange}
              downloadDemoFile={downloadDemoFile}
              columnValidation={columnValidation}
              truncate={truncate}
            />
          )}

          {currentStep === 4 && result && (
            <StepResults
              result={result}
              importing={importing}
              importProgress={importProgress}
              importType={importType}
              isBoard={isBoard}
              file={file}
              selectedClassName={selectedClassName}
              selectedSubjectName={selectedSubjectName}
              selectedChapterName={selectedChapterName}
              selectedBoardName={selectedBoardName}
              year={year}
              importHistory={importHistory}
            />
          )}
        </motion.div>
      </AnimatePresence>

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
