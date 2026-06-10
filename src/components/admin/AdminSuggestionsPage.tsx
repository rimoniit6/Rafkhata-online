'use client'

import React, { useState, useEffect, useCallback } from 'react'
// framer-motion animations minimized to prevent cursor-jump / remount bug in editor
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Plus,
  Crown,
  Trash2,
  Edit,
  Eye,
  Search,
  BookOpen,
  GraduationCap,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ContentBlockEditor, {
  serializeBlocks,
  deserializeBlocks,
  ContentBlock,
} from '@/components/ui/content-block-editor'
import { processContentBlocks } from '@/lib/math-converter'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ─── Data Model ───────────────────────────────────────────────
interface SuggestionRecord {
  id: string
  title: string
  examName: string
  classId: string | null
  subjectId: string | null
  content: string
  isPremium: boolean
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  class?: { id: string; name: string; slug: string } | null
  subject?: { id: string; name: string; slug: string } | null
}

interface ClassItem {
  id: string
  name: string
  slug: string
}

interface SubjectItem {
  id: string
  name: string
  slug: string
}

type ViewMode = 'list' | 'editor'

// ─── Empty Form ───────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  examName: '',
  classId: '__none__',
  subjectId: '__none__',
  isPremium: false,
  price: 0,
  isActive: true,
}

// ─── Helpers ──────────────────────────────────────────────────
function formatDateBn(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getBlockCount(content: string): number {
  if (!content) return 0
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.length
    return 1
  } catch {
    return 1
  }
}

// ─── Component ────────────────────────────────────────────────
export default function AdminSuggestionsPage() {
  const { toast } = useToast()

  // Data
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])

  // View
  const [view, setView] = useState<ViewMode>('list')

  // Editor state
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formPrice, setFormPrice] = useState('0')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SuggestionRecord | null>(null)

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPremium, setFilterPremium] = useState<string>('all')

  // Hierarchy data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // ── Load classes on mount ──
  useEffect(() => {
    fetch('/api/admin/classes')
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
  }, [])

  // ── Load subjects when form classId changes ──
  useEffect(() => {
    if (!form.classId || form.classId === '__none__') {
      setSubjects([])
      return
    }
    setSubjectsLoading(true)
    fetch(`/api/admin/subjects?classId=${form.classId}`)
      .then((r) => r.json())
      .then((d) => setSubjects(Array.isArray(d.data) ? d.data : []))
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false))
  }, [form.classId])

  // ── Reset subjectId when classId changes ──
  const prevClassIdRef = React.useRef(form.classId)
  useEffect(() => {
    if (prevClassIdRef.current !== form.classId) {
      setForm((f) => ({ ...f, subjectId: '__none__' }))
      prevClassIdRef.current = form.classId
    }
  }, [form.classId])

  // ── Fetch suggestions ──
  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPremium === 'premium') params.set('isPremium', 'true')
      else if (filterPremium === 'free') params.set('isPremium', 'false')
      params.set('limit', '200')

      const res = await fetch(`/api/admin/suggestions?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setSuggestions(json.data?.suggestions ?? json.data ?? [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [filterPremium])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  // ── Filtered list (client-side search) ──
  const filteredSuggestions = suggestions.filter((s) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.examName.toLowerCase().includes(q) ||
      (s.class?.name || '').toLowerCase().includes(q) ||
      (s.subject?.name || '').toLowerCase().includes(q)
    )
  })

  // ── Stats ──
  const stats = {
    total: suggestions.length,
    free: suggestions.filter((s) => !s.isPremium).length,
    premium: suggestions.filter((s) => s.isPremium).length,
    active: suggestions.filter((s) => s.isActive).length,
  }

  // ── Editor helpers ──
  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormPrice('0')
    setBlocks([])
    setSubjects([])
    setView('editor')
  }

  const openEdit = (suggestion: SuggestionRecord) => {
    setEditId(suggestion.id)
    setForm({
      title: suggestion.title,
      examName: suggestion.examName,
      classId: suggestion.classId || '__none__',
      subjectId: suggestion.subjectId || '__none__',
      isPremium: suggestion.isPremium,
      price: suggestion.price,
      isActive: suggestion.isActive,
    })
    setFormPrice(String(suggestion.price))
    setBlocks(deserializeBlocks(suggestion.content))
    // Sync ref so the reset useEffect doesn't fire and overwrite subjectId
    prevClassIdRef.current = suggestion.classId || '__none__'
    setView('editor')
  }

  const cancelEditor = () => {
    setView('list')
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormPrice('0')
    setBlocks([])
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!form.examName.trim()) {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষার নাম আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        ...(editId ? { id: editId } : {}),
        title: form.title.trim(),
        examName: form.examName.trim(),
        classId: form.classId && form.classId !== '__none__' ? form.classId : null,
        subjectId: form.subjectId && form.subjectId !== '__none__' ? form.subjectId : null,
        content: serializeBlocks(processContentBlocks(blocks)),
        isPremium: form.isPremium,
        price: form.isPremium ? (parseFloat(formPrice) || 0) : 0,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/suggestions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'সাজেশান আপডেট হয়েছে' : 'সাজেশান তৈরি হয়েছে' })
        cancelEditor()
        fetchSuggestions()
      } else {
        const json = await res.json()
        toast({
          title: 'ত্রুটি',
          description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/suggestions?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'সাজেশান মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        fetchSuggestions()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-emerald-600" />
            সাজেশান ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total}টি সাজেশান
          </p>
        </div>
        {view === 'list' && (
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন সাজেশান
          </Button>
        )}
      </div>

      {/* ── Stats Cards ── */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Lightbulb className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">মোট সাজেশান</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.free}</p>
                  <p className="text-xs text-muted-foreground">ফ্রি</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Crown className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.premium}</p>
                  <p className="text-xs text-muted-foreground">প্রিমিয়াম</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">সক্রিয়</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── View Switch ── */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search / Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="সাজেশান খুঁজুন…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterPremium} onValueChange={setFilterPremium}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="ধরন ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল</SelectItem>
                  <SelectItem value="free">ফ্রি</SelectItem>
                  <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suggestions list */}
            <div className="space-y-3 max-h-[calc(100vh-440px)] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSuggestions.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">কোনো সাজেশান পাওয়া যায়নি</p>
                </div>
              )}

              {filteredSuggestions.map((suggestion, idx) => {
                const blockCount = getBlockCount(suggestion.content)

                return (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card
                      className={cn(
                        'border-l-4 transition-all hover:shadow-md',
                        suggestion.isPremium
                          ? 'border-l-amber-500'
                          : 'border-l-emerald-500',
                        !suggestion.isActive && 'opacity-60'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              'p-2 rounded-lg shrink-0 self-start',
                              suggestion.isPremium
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                            )}
                          >
                            <Lightbulb className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {suggestion.title}
                              </h3>

                              {/* Free/Premium badge */}
                              {suggestion.isPremium ? (
                                <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 shrink-0 text-[10px] px-1.5 py-0">
                                  <Crown className="h-2.5 w-2.5" />
                                  প্রিমিয়াম
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0 text-[10px] px-1.5 py-0">
                                  <BookOpen className="h-2.5 w-2.5" />
                                  ফ্রি
                                </Badge>
                              )}

                              {/* Premium price */}
                              {suggestion.isPremium && suggestion.price > 0 && (
                                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 dark:border-amber-700">
                                  ৳{suggestion.price}
                                </Badge>
                              )}

                              {/* Active status */}
                              {suggestion.isActive ? (
                                <Badge className="shrink-0 text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300">
                                  সক্রিয়
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>

                            {/* Exam name */}
                            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {suggestion.examName}
                              </span>
                            </div>

                            {/* Class/Subject badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              {suggestion.class && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                  <GraduationCap className="h-2.5 w-2.5" />
                                  {suggestion.class.name}
                                </Badge>
                              )}
                              {suggestion.subject && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                  <BookOpen className="h-2.5 w-2.5" />
                                  {suggestion.subject.name}
                                </Badge>
                              )}
                              {!suggestion.class && !suggestion.subject && (
                                <span className="text-[10px] text-muted-foreground italic">
                                  ক্লাস/বিষয় নির্বাচিত নয়
                                </span>
                              )}
                            </div>

                            {/* Meta row: block count + date */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {blockCount}টি ব্লক
                              </span>
                              <span>📅 {formatDateBn(suggestion.createdAt)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 self-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="সম্পাদনা"
                              onClick={() => openEdit(suggestion)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="মুছুন"
                              onClick={() => setDeleteTarget(suggestion)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          /* ── Editor View ── */
          <div key="editor">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-emerald-600" />
                  {editId ? 'সাজেশান সম্পাদনা' : 'নতুন সাজেশান তৈরি'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="suggestion-title">শিরোনাম *</Label>
                  <Input
                    id="suggestion-title"
                    placeholder="সাজেশানের শিরোনাম লিখুন…"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Exam Name */}
                <div className="space-y-2">
                  <Label htmlFor="suggestion-exam">পরীক্ষার নাম *</Label>
                  <Input
                    id="suggestion-exam"
                    placeholder="যেমন: SSC 2025, HSC 2024"
                    value={form.examName}
                    onChange={(e) =>
                      setForm({ ...form, examName: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    পরীক্ষার নাম ও সাল উল্লেখ করুন (যেমন: SSC 2025, HSC 2024)
                  </p>
                </div>

                {/* Class / Subject Cascade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Class selector */}
                  <div className="space-y-2">
                    <Label>ক্লাস</Label>
                    <Select
                      value={form.classId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, classId: v, subjectId: '__none__' })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">কোনোটি নয়</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject selector */}
                  <div className="space-y-2">
                    <Label>বিষয়</Label>
                    <Select
                      value={form.subjectId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, subjectId: v })
                      }
                      disabled={!form.classId || form.classId === '__none__'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            subjectsLoading
                              ? 'লোড হচ্ছে…'
                              : 'বিষয় নির্বাচন করুন'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">কোনোটি নয়</SelectItem>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Content Block Editor */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    কন্টেন্ট ব্লকসমূহ
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    সাজেশানের বিষয়বস্তু এখানে সম্পাদনা করুন। বিভিন্ন ধরনের
                    ব্লক যোগ করে কন্টেন্ট তৈরি করুন।
                  </p>
                  <ContentBlockEditor
                    blocks={blocks}
                    onChange={setBlocks}
                  />
                </div>

                {/* Free/Paid toggle */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="suggestion-premium"
                      checked={form.isPremium}
                      onCheckedChange={(v) =>
                        setForm({ ...form, isPremium: v })
                      }
                    />
                    <Label
                      htmlFor="suggestion-premium"
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <Crown
                        className={cn(
                          'h-3.5 w-3.5',
                          form.isPremium
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                        )}
                      />
                      প্রিমিয়াম সাজেশান
                    </Label>
                  </div>

                  {/* Price input - visible only when isPremium */}
                  <AnimatePresence>
                    {form.isPremium && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pl-0">
                          <Label htmlFor="suggestion-price">মূল্য (৳)</Label>
                          <Input
                            id="suggestion-price"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="মূল্য লিখুন"
                            value={formPrice}
                            onChange={(e) =>
                              setFormPrice(e.target.value)
                            }
                            className="w-full sm:w-48"
                          />
                          <p className="text-xs text-muted-foreground">
                            প্রিমিয়াম সাজেশানের মূল্য টাকায় নির্ধারণ করুন
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="suggestion-active"
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm({ ...form, isActive: v })
                    }
                  />
                  <Label
                    htmlFor="suggestion-active"
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle
                      className={cn(
                        'h-3.5 w-3.5',
                        form.isActive
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                      )}
                    />
                    সক্রিয়
                  </Label>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={cancelEditor}
                    disabled={saving}
                  >
                    বাতিল
                  </Button>
                  <Button
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        সংরক্ষণ হচ্ছে…
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {editId ? 'আপডেট করুন' : 'তৈরি করুন'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation AlertDialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>সাজেশান মুছুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে &quot;{deleteTarget?.title}&quot; সাজেশানটি
              মুছে ফেলতে চান? এই কাজটি আনডু করা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
