'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Upload, Edit, Trash2, Crown, Save, X, Download, Loader2,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import ImageUploader from '@/components/ui/image-uploader'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string }
interface ChapterItem { id: string; name: string; order: number }

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
  chapter?: { id: string; name: string; slug: string }
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

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormData>({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkPreview, setBulkPreview] = useState<Record<string, string | number | boolean | undefined>[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const safeArray = (json: unknown): unknown[] => {
    if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>
      if (obj.classes && Array.isArray(obj.classes)) return obj.classes as unknown[]
      if (obj.subjects && Array.isArray(obj.subjects)) return obj.subjects as unknown[]
      if (obj.chapters && Array.isArray(obj.chapters)) return obj.chapters as unknown[]
    }
    return Array.isArray(json) ? json : []
  }

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      const json = await res.json()
      const raw = json?.success ? json.data : json
      setClasses(safeArray(raw) as ClassItem[])
    } catch { setClasses([]) }
  }, [])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      const arr = json?.success ? (Array.isArray(json.data) ? json.data : []) : []
      setSubjects(arr as SubjectItem[])
    } catch { setSubjects([]) }
  }, [])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      const arr = json?.success ? (Array.isArray(json.data) ? json.data : []) : []
      setChapters(arr as ChapterItem[])
    } catch { setChapters([]) }
  }, [])

  const fetchQuestions = useCallback(async () => {
    if (!selectedChapter) { setQuestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/knowledge-questions?chapterId=${selectedChapter}`)
      const json = await res.json()
      const data = json.success ? json.data : (Array.isArray(json) ? json : [])
      setQuestions(data || [])
    } catch { setQuestions([]) }
    finally { setLoading(false) }
  }, [selectedChapter])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  useEffect(() => {
    if (selectedClass) fetchSubjects(selectedClass)
    else setSubjects([])
  }, [selectedClass, fetchSubjects])

  useEffect(() => {
    if (selectedSubject) fetchChapters(selectedSubject)
    else setChapters([])
  }, [selectedSubject, fetchChapters])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const openCreate = () => {
    setForm({ ...emptyForm, chapterId: selectedChapter, order: questions.length + 1 })
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
    setDialogOpen(true)
  }

  const saveQuestion = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: 'প্রশ্ন ও উত্তর লিখুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const method = form.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/knowledge-questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'short' }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: form.id ? 'আপডেট হয়েছে' : 'সংরক্ষিত হয়েছে' })
        setDialogOpen(false)
        fetchQuestions()
      } else {
        toast({ title: json.error || 'ত্রুটি হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'সংরক্ষণে ত্রুটি', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/knowledge-questions?id=${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchQuestions()
      } else {
        toast({ title: json.error || 'ত্রুটি হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'মুছতে ত্রুটি', variant: 'destructive' })
    }
  }

  const downloadDemoFile = () => {
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
      const buffer = await f.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) { toast({ title: 'ফাইলে কোনো শীট নেই', variant: 'destructive' }); return }
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | undefined>>(worksheet, { defval: '' })
      if (rows.length === 0) { toast({ title: 'ফাইলে কোনো ডেটা নেই', variant: 'destructive' }); return }
      setBulkPreview(rows.slice(0, 20))
    } catch { toast({ title: 'ফাইল পড়তে সমস্যা হয়েছে', variant: 'destructive' }) }
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
    if (!selectedChapter || !bulkFile) return
    setBulkUploading(true)
    try {
      const buffer = await bulkFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) { toast({ title: 'ফাইলে কোনো শীট নেই', variant: 'destructive' }); setBulkUploading(false); return }
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | undefined>>(workbook.Sheets[sheetName], { defval: '' })
      let success = 0; let failed = 0
      for (const row of rows) {
        try {
          const body: Record<string, unknown> = { chapterId: selectedChapter, type: 'short' }
          if (row.question) body.question = String(row.question)
          if (row.answer) body.answer = String(row.answer)
          if (row.questionImage) body.questionImage = String(row.questionImage)
          if (row.answerImage) body.answerImage = String(row.answerImage)
          body.isPremium = row.isPremium === 'true' || row.isPremium === true
          body.price = typeof row.price === 'number' ? row.price : (parseFloat(String(row.price)) || 0)
          body.order = typeof row.order === 'number' ? row.order : (parseInt(String(row.order)) || 0)
          if (!body.question || !body.answer) { failed++; continue }
          const res = await fetch('/api/admin/knowledge-questions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
          const json = await res.json()
          if (json.success) success++; else failed++
        } catch { failed++ }
      }
      setBulkDialogOpen(false); setBulkFile(null); setBulkPreview([])
      fetchQuestions()
      toast({ title: `${toBengaliNumerals(success)} টি যোগ হয়েছে${failed ? `, ${toBengaliNumerals(failed)} টি ব্যর্থ` : ''}` })
    } catch { toast({ title: 'আপলোড করতে সমস্যা হয়েছে', variant: 'destructive' }) }
    finally { setBulkUploading(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">সংক্ষিপ্ত প্রশ্ন ব্যবস্থাপনা</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
              <SelectTrigger><SelectValue placeholder="বিষয় নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedSubject}>
              <SelectTrigger><SelectValue placeholder="অধ্যায় নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {chapters.map(ch => (
                  <SelectItem key={ch.id} value={ch.id}>{ch.order}. {ch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      {selectedChapter && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            মোট {toBengaliNumerals(questions.length)} টি প্রশ্ন
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
      )}

      {/* Questions table */}
      {selectedChapter && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : questions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                কোনো প্রশ্ন নেই। উপরে &quot;নতুন প্রশ্ন&quot; বাটনে ক্লিক করে যোগ করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">প্রশ্ন</th>
                      <th className="text-left p-3">উত্তর</th>
                      <th className="text-center p-3">প্রিমিয়াম</th>
                      <th className="text-center p-3">সক্রিয়</th>
                      <th className="text-center p-3">ক্রম</th>
                      <th className="text-center p-3 w-24">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 max-w-xs truncate">{q.question}</td>
                        <td className="p-3 max-w-xs truncate">{q.answer}</td>
                        <td className="p-3 text-center">
                          {q.isPremium ? (
                            <Crown className="size-4 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-xs text-muted-foreground">ফ্রি</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn('inline-block w-2 h-2 rounded-full', q.isActive ? 'bg-emerald-500' : 'bg-red-400')} />
                        </td>
                        <td className="p-3 text-center">{q.order}</td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                              <Edit className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(q.id)}>
                              <Trash2 className="size-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'প্রশ্ন সম্পাদনা' : 'নতুন প্রশ্ন'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button variant="outline" onClick={() => { setBulkDialogOpen(false); setBulkFile(null); setBulkPreview([]) }}>
              <X className="size-4 mr-1" /> বাতিল
            </Button>
            <Button onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile}>
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
    </div>
  )
}
