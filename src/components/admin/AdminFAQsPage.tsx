'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Power,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'
import { cn } from '@/lib/utils'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

// ─── Data Model ───────────────────────────────────────────────
interface FAQRecord {
  id: string
  question: string
  answer: string
  category: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  question: '',
  answer: '',
  category: '',
  order: 0,
  isActive: true,
}

// ─── Component ────────────────────────────────────────────────
export default function AdminFAQsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── Fetch FAQs ──
  const fetchFaqs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory && filterCategory !== 'all') params.set('category', filterCategory)
      const res = await fetch(`/api/admin/faqs?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setFaqs(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [filterCategory])

  useEffect(() => {
    fetchFaqs()
  }, [fetchFaqs])

  // ── Unique categories ──
  const categories = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean))) as string[]

  // ── Filtered list ──
  const filteredFaqs = faqs.filter((f) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      (f.category && f.category.toLowerCase().includes(q))
    )
  })

  // ── Stats ──
  const stats = {
    total: faqs.length,
    active: faqs.filter((f) => f.isActive).length,
    inactive: faqs.filter((f) => !f.isActive).length,
    categories: categories.length,
  }

  // ── Dialog helpers ──
  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm, order: faqs.length })
    setDialogOpen(true)
  }

  const openEdit = (faq: FAQRecord) => {
    setEditId(faq.id)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      order: faq.order,
      isActive: faq.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: 'ত্রুটি', description: 'প্রশ্ন এবং উত্তর আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || null,
        order: form.order,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/faqs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, ...body }),
          })
        : await fetch('/api/admin/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'FAQ আপডেট হয়েছে' : 'FAQ তৈরি হয়েছে' })
        setDialogOpen(false)
        fetchFaqs()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'FAQ মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchFaqs()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (faq: FAQRecord) => {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
      })
      if (res.ok) {
        toast({ title: faq.isActive ? 'FAQ নিষ্ক্রিয় করা হয়েছে' : 'FAQ সক্রিয় করা হয়েছে' })
        fetchFaqs()
      }
    } catch {
      /* */
    }
  }

  const selection = useTableSelection(filteredFaqs)

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch(`/api/admin/faqs?ids=${ids.join(',')}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); selection.clearSelection(); fetchFaqs() }
    else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleBulkToggle = async (ids: string[], isActive: boolean) => {
    const res = await fetch('/api/admin/faqs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, isActive }),
    })
    if (res.ok) { toast({ title: 'আপডেট হয়েছে' }); selection.clearSelection(); fetchFaqs() }
    else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const moveFaq = async (faq: FAQRecord, direction: 'up' | 'down') => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((f) => f.id === faq.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swapWith) return

    try {
      await Promise.all([
        fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: faq.id, order: swapWith.order }),
        }),
        fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapWith.id, order: faq.order }),
        }),
      ])
      fetchFaqs()
    } catch {
      /* */
    }
  }

  const columns: ColumnDef<FAQRecord>[] = [
    {
      key: 'order',
      header: 'ক্রম',
      headerClass: 'w-16',
      render: (faq) => {
        const sorted = [...filteredFaqs].sort((a, b) => a.order - b.order)
        const idx = sorted.findIndex((f) => f.id === faq.id)
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{faq.order}</span>
            <div className="flex flex-col">
              <button onClick={() => moveFaq(faq, 'up')} aria-label="উপরে সরান" className="p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30" disabled={idx === 0}>
                <ArrowUp className="h-3 w-3" />
              </button>
              <button onClick={() => moveFaq(faq, 'down')} aria-label="নিচে সরান" className="p-0.5 rounded hover:bg-muted transition-colors disabled:opacity-30" disabled={idx === filteredFaqs.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      },
    },
    {
      key: 'question',
      header: 'প্রশ্ন',
      render: (faq) => (
        <div>
          <div
            role="button"
            tabIndex={0}
            className="text-sm font-medium text-left hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
            onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === faq.id ? null : faq.id) } }}
          >
            <RichContentRenderer content={faq.question} />
            {expandedId === faq.id ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </div>
          <AnimatePresence>
            {expandedId === faq.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                  <RichContentRenderer content={faq.answer} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'ক্যাটাগরি',
      headerClass: 'w-32',
      render: (faq) => faq.category ? <Badge variant="outline" className="text-xs">{faq.category}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'isActive',
      header: 'স্ট্যাটাস',
      headerClass: 'w-24',
      render: (faq) => (
        <button onClick={() => toggleActive(faq)} aria-label="স্ট্যাটাস পরিবর্তন করুন" className="focus:outline-none">
          <Badge className={cn('cursor-pointer text-xs', faq.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
            {faq.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClass: 'w-32',
      render: (faq) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(faq)} title="সম্পাদনা">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(faq.id)} title="মুছুন">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
    },
    {
      label: 'সক্রিয় করুন',
      icon: <CheckCircle className="size-4" />,
      handler: (ids) => handleBulkToggle(ids, true),
    },
    {
      label: 'নিষ্ক্রিয় করুন',
      icon: <Power className="size-4" />,
      handler: (ids) => handleBulkToggle(ids, false),
    },
  ]

  const filters = (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="FAQ খুঁজুন…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="ক্যাটাগরি ফিল্টার" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-emerald-600" />
            FAQ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total}টি FAQ · সক্রিয় {stats.active}টি
          </p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> নতুন FAQ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <HelpCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">মোট FAQ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <CheckCircle className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">সক্রিয়</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40">
                <XCircle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">নিষ্ক্রিয়</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <HelpCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-xs text-muted-foreground">ক্যাটাগরি</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredFaqs}
        total={filteredFaqs.length}
        page={1}
        pageSize={filteredFaqs.length || 1}
        onPageChange={() => {}}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো FAQ পাওয়া যায়নি"
        filters={filters}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
              {editId ? 'FAQ সম্পাদনা' : 'নতুন FAQ তৈরি করুন'}
            </DialogTitle>
            <DialogDescription>
              {editId ? 'FAQ এর তথ্য পরিবর্তন করুন' : 'প্রায়শই জিজ্ঞাসিত প্রশ্ন তৈরি করুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Question */}
            <div className="space-y-2">
              <Label>প্রশ্ন *</Label>
              <Input
                placeholder="প্রশ্ন লিখুন (বাংলায়)"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label>উত্তর *</Label>
              <Textarea
                placeholder="উত্তর লিখুন (বাংলায়)"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={5}
                className="resize-y"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>ক্যাটাগরি</Label>
              <Input
                placeholder="ঐচ্ছিক ক্যাটাগরি (যেমন: সাধারণ, পেমেন্ট, কোর্স)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label>ক্রম (Order)</Label>
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">ছোট সংখ্যা প্রথমে দেখাবে</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm font-medium">সক্রিয় করুন</Label>
                <p className="text-xs text-muted-foreground">নিষ্ক্রিয় থাকলে ওয়েবসাইটে দেখাবে না</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={handleSave}
              disabled={saving || !form.question.trim() || !form.answer.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              FAQ মুছুন
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই FAQ মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
