'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Edit,
  Eye,
  Search,
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ─── Data Model ───────────────────────────────────────────────
interface NoticeRecord {
  id: string
  title: string
  content: string
  type: string
  isPinned: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type ViewMode = 'list' | 'editor'

// ─── Constants ────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  general: {
    label: 'সাধারণ',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    icon: Info,
  },
  urgent: {
    label: 'জরুরি',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    icon: AlertTriangle,
  },
  important: {
    label: 'গুরুত্বপূর্ণ',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    icon: Megaphone,
  },
  announcement: {
    label: 'ঘোষণা',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    icon: CheckCircle,
  },
}

const TYPE_BORDER: Record<string, string> = {
  general: 'border-l-emerald-500',
  urgent: 'border-l-rose-500',
  important: 'border-l-amber-500',
  announcement: 'border-l-purple-500',
}

const EMPTY_FORM = {
  title: '',
  content: '',
  type: 'general',
  isPinned: false,
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

function truncate(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// ─── Component ────────────────────────────────────────────────
export default function AdminNoticesPage() {
  const { toast } = useToast()

  // Data
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState<NoticeRecord[]>([])

  // View
  const [view, setView] = useState<ViewMode>('list')

  // Editor state
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<NoticeRecord | null>(null)

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // ── Fetch notices ──
  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType && filterType !== 'all') params.set('type', filterType)
      params.set('limit', '100')

      const res = await fetch(`/api/admin/notices?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setNotices(json.data?.data ?? json.data ?? [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // ── Filtered list (client-side search) ──
  const filteredNotices = notices.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  })

  // ── Stats ──
  const stats = {
    total: notices.length,
    pinned: notices.filter((n) => n.isPinned).length,
    active: notices.filter((n) => n.isActive).length,
    general: notices.filter((n) => n.type === 'general').length,
    urgent: notices.filter((n) => n.type === 'urgent').length,
    important: notices.filter((n) => n.type === 'important').length,
    announcement: notices.filter((n) => n.type === 'announcement').length,
  }

  // ── Editor helpers ──
  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setView('editor')
  }

  const openEdit = (notice: NoticeRecord) => {
    setEditId(notice.id)
    setForm({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isPinned: notice.isPinned,
      isActive: notice.isActive,
    })
    setView('editor')
  }

  const cancelEditor = () => {
    setView('list')
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        ...(editId ? { id: editId } : {}),
        title: form.title.trim(),
        content: form.content,
        type: form.type,
        isPinned: form.isPinned,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/notices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'নোটিশ আপডেট হয়েছে' : 'নোটিশ তৈরি হয়েছে' })
        cancelEditor()
        fetchNotices()
      } else {
        const json = await res.json()
        toast({
          title: 'ত্রুটি',
          description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/admin/notices?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'নোটিশ মুছে ফেলা হয়েছে' })
        setDeleteTarget(null)
        fetchNotices()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const togglePinned = async (notice: NoticeRecord) => {
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notice.id, isPinned: !notice.isPinned }),
      })
      if (res.ok) {
        toast({
          title: notice.isPinned ? 'পিন সরানো হয়েছে' : 'পিন করা হয়েছে',
        })
        fetchNotices()
      }
    } catch {
      /* */
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
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
            <Bell className="h-6 w-6 text-emerald-600" />
            নোটিশ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total}টি নোটিশ
          </p>
        </div>
        {view === 'list' && (
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন নোটিশ
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Bell className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">মোট নোটিশ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Pin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pinned}</p>
                  <p className="text-xs text-muted-foreground">পিন করা</p>
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
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-rose-600 font-semibold">
                      {stats.urgent} জরুরি
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stats.general} সাধারণ · {stats.important} গুরুত্বপূর্ণ ·{' '}
                    {stats.announcement} ঘোষণা
                  </p>
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
                  placeholder="নোটিশ খুঁজুন…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="ধরন ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ধরন</SelectItem>
                  <SelectItem value="general">সাধারণ</SelectItem>
                  <SelectItem value="urgent">জরুরি</SelectItem>
                  <SelectItem value="important">গুরুত্বপূর্ণ</SelectItem>
                  <SelectItem value="announcement">ঘোষণা</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notices list */}
            <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 custom-scrollbar">
              {filteredNotices.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">কোনো নোটিশ পাওয়া যায়নি</p>
                </div>
              )}

              {filteredNotices.map((notice, idx) => {
                const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG.general
                const TypeIcon = cfg.icon

                return (
                  <motion.div
                    key={notice.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card
                      className={cn(
                        'border-l-4 transition-all hover:shadow-md',
                        TYPE_BORDER[notice.type] || 'border-l-emerald-500',
                        !notice.isActive && 'opacity-60'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              'p-2 rounded-lg shrink-0 self-start',
                              cfg.color
                            )}
                          >
                            <TypeIcon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {notice.title}
                              </h3>
                              {notice.isPinned && (
                                <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 shrink-0 text-[10px] px-1.5 py-0">
                                  <Pin className="h-2.5 w-2.5" />
                                  পিন
                                </Badge>
                              )}
                              <Badge className={cn('shrink-0 text-[10px] px-1.5 py-0', cfg.color)}>
                                {cfg.label}
                              </Badge>
                              {!notice.isActive && (
                                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                              {notice.isActive && (
                                <Badge className="shrink-0 text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
                                  সক্রিয়
                                </Badge>
                              )}
                            </div>

                            {/* Content preview with RichContentRenderer */}
                            {notice.content && (
                              <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                <RichContentRenderer
                                  content={truncate(notice.content, 200)}
                                  className="text-sm text-muted-foreground"
                                />
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              📅 {formatDateBn(notice.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 self-start">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={notice.isPinned ? 'পিন সরান' : 'পিন করুন'}
                              onClick={() => togglePinned(notice)}
                            >
                              <Pin
                                className={cn(
                                  'h-4 w-4',
                                  notice.isPinned
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-muted-foreground'
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="সম্পাদনা"
                              onClick={() => openEdit(notice)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="মুছুন"
                              onClick={() => setDeleteTarget(notice)}
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
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-emerald-600" />
                  {editId ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="notice-title">শিরোনাম *</Label>
                  <Input
                    id="notice-title"
                    placeholder="নোটিশের শিরোনাম লিখুন…"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Type selector */}
                <div className="space-y-2">
                  <Label>ধরন</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="w-full sm:w-60">
                      <SelectValue placeholder="ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">সাধারণ</SelectItem>
                      <SelectItem value="urgent">জরুরি</SelectItem>
                      <SelectItem value="important">গুরুত্বপূর্ণ</SelectItem>
                      <SelectItem value="announcement">ঘোষণা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Content textarea + live preview side by side */}
                <div className="space-y-2">
                  <Label htmlFor="notice-content">বিষয়বস্তু</Label>
                  <p className="text-xs text-muted-foreground">
                    KaTeX সাপোর্ট: ইনলাইন গণিতের জন্য <code className="bg-muted px-1 rounded text-xs">$...$</code> এবং ব্লক গণিতের জন্য{' '}
                    <code className="bg-muted px-1 rounded text-xs">{'$$...$$'}</code> ব্যবহার করুন
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Textarea */}
                    <Textarea
                      id="notice-content"
                      placeholder="নোটিশের বিষয়বস্তু লিখুন… গণিত লেখার জন্য $...$ বা $$...$$ ব্যবহার করুন"
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                      rows={10}
                      className="font-mono text-sm resize-y"
                    />

                    {/* Live preview */}
                    <div className="border rounded-lg p-4 min-h-[200px] bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> লাইভ প্রিভিউ
                      </p>
                      {form.content ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <RichContentRenderer
                            content={form.content}
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          বিষয়বস্তু টাইপ করলে এখানে প্রিভিউ দেখা যাবে
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="notice-pinned"
                      checked={form.isPinned}
                      onCheckedChange={(v) =>
                        setForm({ ...form, isPinned: v })
                      }
                    />
                    <Label htmlFor="notice-pinned" className="flex items-center gap-1.5 cursor-pointer">
                      <Pin className="h-3.5 w-3.5 text-amber-500" />
                      পিন করুন
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="notice-active"
                      checked={form.isActive}
                      onCheckedChange={(v) =>
                        setForm({ ...form, isActive: v })
                      }
                    />
                    <Label htmlFor="notice-active" className="flex items-center gap-1.5 cursor-pointer">
                      <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
                      সক্রিয়
                    </Label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2 border-t">
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
          </motion.div>
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
            <AlertDialogTitle>নোটিশ মুছুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে &quot;{deleteTarget?.title}&quot; নোটিশটি মুছে ফেলতে
              চান? এই কাজটি আনডু করা যাবে না।
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
