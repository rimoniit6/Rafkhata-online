'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
  Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,SelectContent,SelectItem,SelectTrigger,SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ExcelParseError,safeParseExcelClient } from '@/lib/excel-parse'
import {
  Crown,
  Download,
  Edit,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react'

import DataTable from '@/components/shared/DataTable'
import ImageUploader from '@/components/ui/image-uploader'
import { useHierarchyChapters,useHierarchyClasses,useHierarchySubjects } from '@/hooks/admin/use-hierarchy-selectors'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import { knowledgeQuestionService } from '@/services/api/knowledge-question.service'
import { useKnowledgeQuestions } from '@/hooks/admin/use-knowledge-questions'
import { QueryError } from '@/components/admin/QueryError'
import { cn,toBengaliNumerals } from '@/lib/utils'

interface QuestionRecord {
  id: string
  chapterId: string
  question: string
  answer: string
  questionImage: string | null
  answerImage: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
  createdAt: string
  chapter?: {
    id: string
    name: string
    slug: string
    subject?: {
      id: string
      name: string
      class?: { id: string; name: string; slug: string }
    }
  }
}

interface DialogHierarchy {
  classId: string
  subjectId: string
  chapterId: string
}

interface FormData {
  id?: string
  chapterId: string
  question: string
  answer: string
  questionImage: string | null
  answerImage: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
}

const emptyForm: FormData = {
  chapterId: '',
  question: '',
  answer: '',
  questionImage: null,
  answerImage: null,
  isPremium: false,
  price: 0,
  order: 0,
  isActive: true,
}

export default function AdminKnowledgeQuestionsPage() {
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])
  const [total, setTotal] = useState(0)

  const [filterClass, setFilterClass] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterChapter, setFilterChapter] = useState('')

  const [bulkClassId, setBulkClassId] = useState('')
  const [bulkSubjectId, setBulkSubjectId] = useState('')
  const [bulkChapterId, setBulkChapterId] = useState('')

  const [dialogHierarchy, setDialogHierarchy] = useState<DialogHierarchy>({
    classId: '', subjectId: '', chapterId: '',
  })

  const classes = useHierarchyClasses()
  const filterClassId = useMemo(
    () => classes.find((c) => c.slug === filterClass)?.id,
    [classes, filterClass],
  )
  const filterSubjects = useHierarchySubjects(filterClassId)
  const filterChapters = useHierarchyChapters(filterSubject)
  const dialogSubjects = useHierarchySubjects(dialogHierarchy.classId)
  const dialogChapters = useHierarchyChapters(dialogHierarchy.subjectId)
  const bulkSubjects = useHierarchySubjects(bulkClassId)
  const bulkChapters = useHierarchyChapters(bulkSubjectId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormData>({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkPreview, setBulkPreview] = useState<Record<string, string | number | boolean | undefined>[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const selection = useTableSelection(questions)

  const {
    questions: fetchedQuestions,
    total: fetchedTotal,
    isLoading: loading,
    isError,
    error,
    invalidate,
  } = useKnowledgeQuestions({
    page,
    limit: perPage,
    chapterId: filterChapter || undefined,
    classLevel: filterClass || undefined,
    subjectId: filterSubject || undefined,
    q: search || undefined,
    isPremium: premiumFilter === 'premium' ? true : premiumFilter === 'free' ? false : undefined,
    isActive: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
  })

  useEffect(() => {
    setQuestions(fetchedQuestions)
    setTotal(fetchedTotal)
  }, [fetchedQuestions, fetchedTotal])

  const openCreate = () => {
    const chapterId = filterChapter || ''
    setForm({ ...emptyForm, chapterId, order: questions.length + 1 })
    setDialogHierarchy({
      classId: filterClassId || '',
      subjectId: filterSubject,
      chapterId,
    })
    setDialogOpen(true)
  }

  const openEdit = (q: QuestionRecord) => {
    setForm({
      id: q.id,
      chapterId: q.chapterId,
      question: q.question,
      answer: q.answer,
      questionImage: q.questionImage,
      answerImage: q.answerImage,
      isPremium: q.isPremium,
      price: q.price,
      order: q.order,
      isActive: q.isActive,
    })
    setDialogHierarchy({
      classId: '',
      subjectId: '',
      chapterId: q.chapterId,
    })
    setDialogOpen(true)
  }

  const saveQuestion = async () => {
    const chapterId = dialogHierarchy.chapterId || form.chapterId
    if (!chapterId) {
      toast({ title: 'একটি অধ্যায় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: 'প্রশ্ন ও উত্তর লিখুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, chapterId, type: 'knowledge' }
      if (form.id) {
        await knowledgeQuestionService.update(form.id, payload)
      } else {
        await knowledgeQuestionService.create(payload)
      }
      toast({ title: form.id ? 'আপডেট হয়েছে' : 'সংরক্ষিত হয়েছে' })
      setDialogOpen(false)
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await knowledgeQuestionService.remove(deleteId)
      toast({ title: 'মুছে ফেলা হয়েছে' })
      setDeleteId(null)
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    }
  }

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      await knowledgeQuestionService.bulkRemove(ids)
      toast({ title: 'মুছে ফেলা হয়েছে' })
      selection.clearSelection()
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    }
  }, [selection, invalidate, toast])

  const downloadDemoFile = async () => {
    const XLSX = await import('xlsx')
    const data = [
      { question: 'পানির রাসায়নিক সংকেত কী?', answer: 'H₂O', isPremium: 'false', price: 0, order: 1 },
      { question: 'পানি কেন জীবনের জন্য অপরিহার্য?', answer: 'পানি খাদ্য পরিপাকে, দেহের তাপমাত্রা নিয়ন্ত্রণে সহায়তা করে।', isPremium: 'false', price: 0, order: 2 },
      { question: 'বাংলাদেশের জাতীয় সংগীতের রচয়িতা কে?', answer: 'রবীন্দ্রনাথ ঠাকুর', isPremium: 'true', price: 10, order: 3 },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Questions')
    const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length * 2, 25) }))
    ws['!cols'] = colWidths
    XLSX.writeFile(wb, 'সংক্ষিপ্ত_প্রশ্ন_ডেমো_টেমপ্লেট.xlsx')
  }

  const parseBulkFile = useCallback(async (f: File) => {
    try {
      const { rows } = await safeParseExcelClient(f)
      if (rows.length === 0) { toast({ title: 'ফাইলে কোনো ডেটা নেই', variant: 'destructive' }); return }
      setBulkPreview(rows.slice(0, 20))
    } catch (err) {
      const msg = err instanceof ExcelParseError ? err.message : 'ফাইল পড়তে সমস্যা হয়েছে'
      toast({ title: 'ত্রুটি', description: msg, variant: 'destructive' })
    }
  }, [toast])

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast({ title: 'শুধুমাত্র .xlsx, .xls, .csv ফাইল সমর্থিত', variant: 'destructive' })
      return
    }
    setBulkFile(f)
    parseBulkFile(f)
  }

  const handleBulkUpload = async () => {
    if (!bulkChapterId || !bulkFile) return
    setBulkUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', bulkFile)
      formData.append('type', 'knowledge')
      formData.append('chapterId', bulkChapterId)

      const result = await knowledgeQuestionService.bulkImport(formData)
      setBulkDialogOpen(false); setBulkFile(null); setBulkPreview([])
      invalidate()
      const errorSummary = result.errors.length > 0
        ? `\n${result.errors.slice(0, 5).map(e => `সারি ${e.row}: ${e.message}`).join('\n')}${result.errors.length > 5 ? `\n...আরও ${result.errors.length - 5} টি ত্রুটি` : ''}`
        : ''
      toast({
        title: `${toBengaliNumerals(result.success)} টি যোগ হয়েছে${result.errors.length ? `, ${toBengaliNumerals(result.errors.length)} টি ব্যর্থ` : ''}`,
        description: errorSummary || undefined,
      })
    } catch {
      toast({ title: 'আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally { setBulkUploading(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">সংক্ষিপ্ত প্রশ্ন ব্যবস্থাপনা</h1>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          মোট {toBengaliNumerals(total)} টি প্রশ্ন
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="size-4 mr-1" /> বাল্ক আপলোড
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-1" /> নতুন প্রশ্ন
          </Button>
        </div>
      </div>

      {/* Questions table with DataTable */}
      <DataTable<QuestionRecord>
        columns={[
          {
            key: 'class',
            header: 'শ্রেণি',
            render: (q) => <span>{q.chapter?.subject?.class?.name || '-'}</span>,
            cellClass: 'hidden md:table-cell',
          },
          {
            key: 'subject',
            header: 'বিষয়',
            render: (q) => <span>{q.chapter?.subject?.name || '-'}</span>,
            cellClass: 'hidden md:table-cell',
          },
          {
            key: 'chapter',
            header: 'অধ্যায়',
            render: (q) => <span>{q.chapter?.name || '-'}</span>,
            cellClass: 'hidden lg:table-cell',
          },
          {
            key: 'question',
            header: 'প্রশ্ন',
            render: (q) => <span className="max-w-xs truncate block">{q.question}</span>,
            cellClass: 'font-medium max-w-[200px] truncate',
          },
          {
            key: 'answer',
            header: 'উত্তর',
            render: (q) => <span className="max-w-xs truncate block">{q.answer}</span>,
            cellClass: 'hidden sm:table-cell max-w-[200px] truncate',
          },
          {
            key: 'premium',
            header: 'প্রিমিয়াম',
            render: (q) =>
              q.isPremium ? (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                  <Crown className="h-3 w-3" />প্রিমিয়াম
                </Badge>
              ) : (
                <Badge variant="secondary">ফ্রি</Badge>
              ),
          },
          {
            key: 'active',
            header: 'সক্রিয়',
            render: (q) => (
              <span className={cn('inline-block w-2 h-2 rounded-full', q.isActive ? 'bg-emerald-500' : 'bg-red-400')} />
            ),
            cellClass: 'text-center',
          },
          {
            key: 'order',
            header: 'ক্রম',
            render: (q) => <span>{q.order}</span>,
            cellClass: 'text-center',
          },
          {
            key: 'actions',
            header: 'অ্যাকশন',
            cellClass: 'w-20',
            render: (q) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(q)} aria-label="সম্পাদনা">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(q.id)} aria-label="মুছুন">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={questions}
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
        emptyMessage="কোনো প্রশ্ন নেই"
        filters={
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="প্রশ্ন বা উত্তর দিয়ে খুঁজুন..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="pl-9"
                  />
                </div>
                <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="প্রিমিয়াম" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব</SelectItem>
                    <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                    <SelectItem value="free">ফ্রি</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="সক্রিয়তা" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব</SelectItem>
                    <SelectItem value="active">সক্রিয়</SelectItem>
                    <SelectItem value="inactive">নিষ্ক্রিয়</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setFilterSubject(''); setFilterChapter(''); setPage(1) }}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="শ্রেণি (সব)" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSubject} onValueChange={(v) => { setFilterSubject(v); setFilterChapter(''); setPage(1) }} disabled={!filterClass}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="বিষয় (সব)" /></SelectTrigger>
                  <SelectContent>
                    {filterSubjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterChapter} onValueChange={(v) => { setFilterChapter(v); setPage(1) }} disabled={!filterSubject}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="অধ্যায় (সব)" /></SelectTrigger>
                  <SelectContent>
                    {filterChapters.map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.order}. {ch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'প্রশ্ন সম্পাদনা' : 'নতুন প্রশ্ন'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Chapter selector for dialog */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>শ্রেণি</Label>
                <Select
                  value={dialogHierarchy.classId}
                  onValueChange={(v) => {
                    setDialogHierarchy(h => ({ ...h, classId: v, subjectId: '', chapterId: '' }))
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>বিষয়</Label>
                <Select
                  value={dialogHierarchy.subjectId}
                  onValueChange={(v) => {
                    setDialogHierarchy(h => ({ ...h, subjectId: v, chapterId: '' }))
                  }}
                  disabled={!dialogHierarchy.classId}
                >
                  <SelectTrigger><SelectValue placeholder="বিষয়" /></SelectTrigger>
                  <SelectContent>
                    {dialogSubjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>অধ্যায়</Label>
                <Select
                  value={dialogHierarchy.chapterId}
                  onValueChange={(v) => setDialogHierarchy(h => ({ ...h, chapterId: v }))}
                  disabled={!dialogHierarchy.subjectId}
                >
                  <SelectTrigger><SelectValue placeholder="অধ্যায়" /></SelectTrigger>
                  <SelectContent>
                    {dialogChapters.map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.order}. {ch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-24">
              <Label>ক্রম</Label>
              <Input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>প্রশ্ন</Label>
              <Textarea
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>প্রশ্নের ছবি (ঐচ্ছিক)</Label>
              <ImageUploader
                value={form.questionImage || ''}
                onChange={url => setForm(f => ({ ...f, questionImage: url || null }))}
              />
            </div>

            <div className="space-y-2">
              <Label>উত্তর</Label>
              <Textarea
                value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>উত্তরের ছবি (ঐচ্ছিক)</Label>
              <ImageUploader
                value={form.answerImage || ''}
                onChange={url => setForm(f => ({ ...f, answerImage: url || null }))}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPremium}
                  onCheckedChange={v => setForm(f => ({ ...f, isPremium: v, price: v ? f.price : 0 }))}
                />
                <Label>প্রিমিয়াম</Label>
              </div>
              {form.isPremium && (
                <div className="flex items-center gap-2">
                  <Label>মূল্য (টাকা)</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                />
                <Label>সক্রিয়</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="size-4 mr-1" /> বাতিল
            </Button>
            <Button onClick={saveQuestion} disabled={saving}>
              <Save className="size-4 mr-1" /> {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>এক্সেল ফাইল আপলোড</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              .xlsx, .xls, .csv ফাইল সিলেক্ট করুন। ফাইলের কলাম হতে হবে: <strong>question</strong>, <strong>answer</strong>, <strong>isPremium</strong>, <strong>price</strong>, <strong>order</strong>
            </p>

            {/* Chapter selector for bulk upload */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>শ্রেণি</Label>
                <Select value={bulkClassId} onValueChange={(v) => { setBulkClassId(v); setBulkSubjectId(''); setBulkChapterId('') }}>
                  <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>বিষয়</Label>
                <Select value={bulkSubjectId} onValueChange={(v) => { setBulkSubjectId(v); setBulkChapterId('') }} disabled={!bulkClassId}>
                  <SelectTrigger><SelectValue placeholder="বিষয়" /></SelectTrigger>
                  <SelectContent>
                    {bulkSubjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>অধ্যায়</Label>
                <Select value={bulkChapterId} onValueChange={setBulkChapterId} disabled={!bulkSubjectId}>
                  <SelectTrigger><SelectValue placeholder="অধ্যায়" /></SelectTrigger>
                  <SelectContent>
                    {bulkChapters.map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.order}. {ch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" onClick={downloadDemoFile} className="gap-2">
              <Download className="size-4" /> ডেমো টেমপ্লেট ডাউনলোড
            </Button>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setBulkFile(f); parseBulkFile(f) } }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleBulkFileChange}
              />
              <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{bulkFile ? bulkFile.name : 'ফাইল সিলেক্ট করতে ক্লিক বা ড্র্যাগ করুন'}</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv ফাইল সমর্থিত</p>
            </div>

            {bulkPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">প্রিভিউ (প্রথম {bulkPreview.length} টি)</p>
                <div className="overflow-x-auto border rounded-lg max-h-60">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {Object.keys(bulkPreview[0]).map(h => <th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.keys(bulkPreview[0]).map(h => (
                            <td key={h} className="p-2 truncate max-w-40">{String(row[h] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBulkDialogOpen(false); setBulkFile(null); setBulkPreview([]); setBulkClassId(''); setBulkSubjectId(''); setBulkChapterId('') }}>
              <X className="size-4 mr-1" /> বাতিল
            </Button>
            <Button onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile || !bulkChapterId}>
              {bulkUploading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Upload className="size-4 mr-1" />}
              {bulkUploading ? 'আপলোড হচ্ছে...' : 'আপলোড'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>মুছে ফেলবেন?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">এই প্রশ্নটি স্থায়ীভাবে মুছে ফেলা হবে।</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={confirmDelete}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isError && <QueryError error={error} onRetry={invalidate} />}
    </div>
  )
}
