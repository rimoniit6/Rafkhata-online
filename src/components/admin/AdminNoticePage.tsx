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
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AnimatePresence,motion } from 'framer-motion'
import {
ArrowLeft,
Bell,
Edit,
ExternalLink,
Eye,
EyeOff,
FileText,
GripVertical,
Image as ImageIcon,
Link2,
Megaphone,
Pin,
Plus,
Save,
Search,
Trash2,
Type,
X
} from 'lucide-react'
import Image from 'next/image'
import React,{ useCallback,useEffect,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

interface NoticeRecord {
  id: string
  title: string
  content: string | null
  type: 'text' | 'pdf' | 'link'
  pdfUrl: string | null
  pdfTitle: string | null
  linkUrl: string | null
  linkLabel: string | null
  thumbnail: string | null
  classLevel: string | null
  isPinned: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

type NoticeType = 'text' | 'pdf' | 'link'

// ─── Constants ──────────────────────────────────────────────────

const typeConfig: Record<NoticeType, {
  label: string
  icon: React.ElementType
  color: string
  borderColor: string
  bgColor: string
  badgeColor: string
}> = {
  text: {
    label: 'টেক্সট',
    icon: Type,
    color: 'text-emerald-600',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  pdf: {
    label: 'পিডিএফ',
    icon: FileText,
    color: 'text-orange-600',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  link: {
    label: 'লিংক',
    icon: Link2,
    color: 'text-cyan-600',
    borderColor: 'border-l-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
}



const emptyForm = {
  title: '',
  content: '',
  type: 'text' as NoticeType,
  pdfUrl: '',
  pdfTitle: '',
  linkUrl: '',
  linkLabel: '',
  thumbnail: '',
  classLevel: '',
  isPinned: false,
  isActive: true,
  order: 0,
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminNoticePage() {
  const { toast } = useToast()
  const { classOptions: classLevelOptions, classLevelLabels } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState<NoticeRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterClassLevel, setFilterClassLevel] = useState<string>('all')
  const [saving, setSaving] = useState(false)

  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState(emptyForm)
  const [formOrder, setFormOrder] = useState('0')

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [appliedSearch, setAppliedSearch] = useState('')

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (appliedSearch) params.set('search', appliedSearch)
      if (filterType && filterType !== 'all') params.set('type', filterType)
      if (filterClassLevel && filterClassLevel !== 'all') params.set('classLevel', filterClassLevel)
      params.set('page', '1')
      params.set('limit', '20')

      const res = await fetch(`/api/admin/notices?${params}`)
      if (res.ok) {
        const json = await res.json()
        const noticesData = json.data?.data ?? json.data ?? []
        setNotices(noticesData)
        setTotal(json.data?.pagination?.total ?? json.pagination?.total ?? noticesData.length)
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, filterType, filterClassLevel])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  // ─── Search with debounce ───────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      setAppliedSearch(value)
    }, 400)
    setSearchTimeout(timeout)
  }

  // ─── Form Helpers ───────────────────────────────────────────

  const resetForm = () => {
    setForm(emptyForm)
    setFormOrder('0')
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (notice: NoticeRecord) => {
    setEditId(notice.id)
    setForm({
      title: notice.title,
      content: notice.content || '',
      type: notice.type,
      pdfUrl: notice.pdfUrl || '',
      pdfTitle: notice.pdfTitle || '',
      linkUrl: notice.linkUrl || '',
      linkLabel: notice.linkLabel || '',
      thumbnail: notice.thumbnail || '',
      classLevel: notice.classLevel || '',
      isPinned: notice.isPinned,
      isActive: notice.isActive,
      order: notice.order,
    })
    setFormOrder(String(notice.order))
    setViewMode('editor')
  }

  const goBackToList = () => {
    setViewMode('list')
    resetForm()
  }

  // ─── CRUD Operations ────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }

    if (form.type === 'text' && !form.content.trim()) {
      toast({ title: 'ত্রুটি', description: 'টেক্সট বিষয়বস্তু আবশ্যক', variant: 'destructive' })
      return
    }

    if (form.type === 'pdf' && !form.pdfUrl.trim()) {
      toast({ title: 'ত্রুটি', description: 'পিডিএফ URL আবশ্যক', variant: 'destructive' })
      return
    }

    if (form.type === 'link' && !form.linkUrl.trim()) {
      toast({ title: 'ত্রুটি', description: 'লিংক URL আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        type: form.type,
        thumbnail: form.thumbnail || undefined,
        classLevel: form.classLevel || undefined,
        isPinned: form.isPinned,
        isActive: form.isActive,
        order: parseInt(formOrder) || 0,
      }

      if (form.type === 'text') {
        body.content = form.content.trim()
      } else if (form.type === 'pdf') {
        body.pdfUrl = form.pdfUrl.trim()
        body.pdfTitle = form.pdfTitle.trim() || undefined
      } else if (form.type === 'link') {
        body.linkUrl = form.linkUrl.trim()
        body.linkLabel = form.linkLabel.trim() || undefined
      }

      const res = editId
        ? await fetch('/api/admin/notices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, ...body }),
          })
        : await fetch('/api/admin/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'নোটিশ আপডেট হয়েছে' : 'নোটিশ তৈরি হয়েছে' })
        goBackToList()
        fetchNotices()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/notices?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'নোটিশ মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchNotices()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (notice: NoticeRecord) => {
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notice.id, isActive: !notice.isActive }),
      })
      if (res.ok) {
        toast({ title: notice.isActive ? 'নোটিশ নিষ্ক্রিয় করা হয়েছে' : 'নোটিশ সক্রিয় করা হয়েছে' })
        fetchNotices()
      }
    } catch {
      /* */
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
        toast({ title: notice.isPinned ? 'পিন সরানো হয়েছে' : 'পিন করা হয়েছে' })
        fetchNotices()
      }
    } catch {
      /* */
    }
  }

  // ─── Helper ─────────────────────────────────────────────────

  const getNoticePreview = (notice: NoticeRecord) => {
    if (notice.type === 'text' && notice.content) {
      return notice.content.length > 80 ? notice.content.slice(0, 80) + '...' : notice.content
    }
    if (notice.type === 'pdf') {
      return notice.pdfTitle || notice.pdfUrl || 'পিডিএফ সংযুক্তি'
    }
    if (notice.type === 'link') {
      return notice.linkLabel || notice.linkUrl || 'বাহ্যিক লিংক'
    }
    return ''
  }

  // ─── Loading Skeleton ───────────────────────────────────────

  if (loading && viewMode === 'list' && notices.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          // ─── LIST VIEW ─────────────────────────────────────
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  নোটিশ ব্যবস্থাপনা
                </h1>
                <p className="text-muted-foreground text-sm mt-2 ml-12">
                  মোট {total}টি নোটিশ
                </p>
              </div>
              <Button
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30"
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" /> নতুন নোটিশ
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="নোটিশ খুঁজুন..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-10 bg-card border-border/50"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 w-full sm:w-40 bg-card border-border/50">
                  <SelectValue placeholder="ধরন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ধরন</SelectItem>
                  <SelectItem value="text">টেক্সট</SelectItem>
                  <SelectItem value="pdf">পিডিএফ</SelectItem>
                  <SelectItem value="link">লিংক</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClassLevel} onValueChange={setFilterClassLevel}>
                <SelectTrigger className="h-10 w-full sm:w-40 bg-card border-border/50">
                  <SelectValue placeholder="শ্রেণি" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল শ্রেণি</SelectItem>
                  {classLevelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notice Cards */}
            <div className="space-y-3">
              {notices.map((notice, idx) => {
                const config = typeConfig[notice.type]
                const TypeIcon = config.icon
                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -1 }}
                  >
                    <Card
                      className={cn(
                        'overflow-hidden transition-all duration-200 hover:shadow-md border-border/50',
                        !notice.isActive && 'opacity-60',
                        'border-l-4',
                        config.borderColor,
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div className={cn('p-2.5 rounded-xl shrink-0', config.bgColor)}>
                            <TypeIcon className={cn('h-5 w-5', config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-sm line-clamp-1">{notice.title}</h3>
                              <Badge className={cn('text-[10px] h-5 px-1.5 shrink-0', config.badgeColor)}>
                                {config.label}
                              </Badge>
                              {notice.isPinned && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] h-5 px-1.5 gap-0.5 shrink-0">
                                  <Pin className="h-2.5 w-2.5" /> পিন
                                </Badge>
                              )}
                              {!notice.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {getNoticePreview(notice)}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              {notice.classLevel && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                  {classLevelLabels[notice.classLevel] || notice.classLevel}
                                </Badge>
                              )}
                              {notice.thumbnail && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" /> থাম্বনেইল
                                </span>
                              )}
                              <span>{new Date(notice.createdAt).toLocaleDateString('bn-BD')}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              onClick={() => togglePinned(notice)}
                              title={notice.isPinned ? 'পিন সরান' : 'পিন করুন'}
                            >
                              <Pin
                                className={cn(
                                  'h-4 w-4',
                                  notice.isPinned ? 'text-amber-500' : 'text-muted-foreground',
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => toggleActive(notice)}
                              title={notice.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                            >
                              {notice.isActive ? (
                                <Eye className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => openEdit(notice)}
                              title="সম্পাদনা"
                            >
                              <Edit className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10"
                              onClick={() => setDeleteId(notice.id)}
                              title="মুছুন"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}

              {notices.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো নোটিশ পাওয়া যায়নি</p>
                  <p className="text-sm mt-1">নতুন নোটিশ তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // ─── EDITOR VIEW (INLINE) ────────────────────────────
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeOut' } as const}
            className="space-y-0"
          >
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={goBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">ফিরে যান</span>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    {editId ? (
                      <>
                        <Edit className="h-5 w-5 text-emerald-600" /> নোটিশ সম্পাদনা
                      </>
                    ) : (
                      <>
                        <Megaphone className="h-5 w-5 text-emerald-600" /> নতুন নোটিশ তৈরি
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    নোটিশের তথ্য পূরণ করুন এবং সংরক্ষণ করুন
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={goBackToList}>
                  <X className="h-4 w-4" /> বাতিল
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'তৈরি করুন'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Main Form (2 cols) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Basic Info Card */}
                <Card className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-emerald-600" /> মৌলিক তথ্য
                    </Label>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label>
                        শিরোনাম <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="নোটিশের শিরোনাম লিখুন..."
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="text-base"
                      />
                    </div>

                    {/* Type Selector */}
                    <div className="space-y-2">
                      <Label>
                        নোটিশের ধরন <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(typeConfig) as NoticeType[]).map((t) => {
                          const cfg = typeConfig[t]
                          const TIcon = cfg.icon
                          const isSelected = form.type === t
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm({ ...form, type: t })}
                              className={cn(
                                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                                isSelected
                                  ? cn(cfg.bgColor, cfg.color, 'border-current shadow-sm')
                                  : 'border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30',
                              )}
                            >
                              <TIcon className="h-4 w-4" />
                              {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Type-specific content */}
                    <AnimatePresence mode="wait">
                      {form.type === 'text' && (
                        <motion.div
                          key="text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2"
                        >
                          <Label>
                            বিষয়বস্তু <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            placeholder="নোটিশের বিষয়বস্তু লিখুন..."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            rows={6}
                            className="resize-y"
                          />
                        </motion.div>
                      )}

                      {form.type === 'pdf' && (
                        <motion.div
                          key="pdf"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          <div className="space-y-2">
                            <Label>
                              পিডিএফ URL <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="https://example.com/document.pdf"
                              value={form.pdfUrl}
                              onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>পিডিএফ শিরোনাম</Label>
                            <Input
                              placeholder="পিডিএফ ফাইলের শিরোনাম..."
                              value={form.pdfTitle}
                              onChange={(e) => setForm({ ...form, pdfTitle: e.target.value })}
                            />
                          </div>
                          {form.pdfUrl && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200/30 dark:border-orange-800/20">
                              <FileText className="h-4 w-4 text-orange-600 shrink-0" />
                              <span className="text-xs text-orange-700 dark:text-orange-300 truncate">
                                {form.pdfTitle || form.pdfUrl}
                              </span>
                              <a
                                href={form.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto shrink-0"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-orange-500 hover:text-orange-600" />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {form.type === 'link' && (
                        <motion.div
                          key="link"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          <div className="space-y-2">
                            <Label>
                              লিংক URL <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="https://example.com/page"
                              value={form.linkUrl}
                              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>লিংক লেবেল</Label>
                            <Input
                              placeholder="লিংকের লেবেল বা নাম..."
                              value={form.linkLabel}
                              onChange={(e) => setForm({ ...form, linkLabel: e.target.value })}
                            />
                          </div>
                          {form.linkUrl && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200/30 dark:border-cyan-800/20">
                              <Link2 className="h-4 w-4 text-cyan-600 shrink-0" />
                              <span className="text-xs text-cyan-700 dark:text-cyan-300 truncate">
                                {form.linkLabel || form.linkUrl}
                              </span>
                              <a
                                href={form.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto shrink-0"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-cyan-500 hover:text-cyan-600" />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Settings Sidebar (1 col) */}
              <div className="space-y-5">
                {/* Thumbnail Card */}
                <Card className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-4 py-3 border-b border-border/30">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-purple-600" /> থাম্বনেইল
                    </Label>
                  </div>
                  <CardContent className="p-4">
                    <ImageUploader
                      value={form.thumbnail}
                      onChange={(url) => setForm({ ...form, thumbnail: url })}
                      placeholder="নোটিশের থাম্বনেইল আপলোড করুন"
                    />
                  </CardContent>
                </Card>

                {/* Settings Card */}
                <Card className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 px-4 py-3 border-b border-border/30">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-orange-600" /> সেটিংস
                    </Label>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* Class Level */}
                    <div className="space-y-2">
                      <Label className="text-xs">শ্রেণি ফিল্টার</Label>
                      <Select
                        value={form.classLevel || 'all'}
                        onValueChange={(v) => setForm({ ...form, classLevel: v === 'all' ? '' : v })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">সকল শ্রেণি</SelectItem>
                          {classLevelOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Order */}
                    <div className="space-y-2">
                      <Label className="text-xs">ক্রম (Order)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formOrder}
                        onChange={(e) => setFormOrder(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <Separator />

                    {/* Pinned Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                          <Pin className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">পিন করুন</Label>
                          <p className="text-xs text-muted-foreground">শীর্ষে পিন করুন</p>
                        </div>
                      </div>
                      <Switch checked={form.isPinned} onCheckedChange={(v) => setForm({ ...form, isPinned: v })} />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                          {form.isActive ? (
                            <Eye className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">সক্রিয়</Label>
                          <p className="text-xs text-muted-foreground">নোটিশ প্রকাশিত থাকবে</p>
                        </div>
                      </div>
                      <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="border-border/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-600" /> প্রিভিউ
                    </Label>
                  </div>
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        'rounded-lg border-l-4 p-3 space-y-2',
                        typeConfig[form.type].borderColor,
                        typeConfig[form.type].bgColor,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(typeConfig[form.type].icon, {
                          className: cn('h-4 w-4', typeConfig[form.type].color),
                        })}
                        <span className="font-semibold text-sm line-clamp-1">
                          {form.title || '(শিরোনাম)'}
                        </span>
                      </div>
                      {(form.type === 'text' && form.content) && (
                        <div className="text-xs text-muted-foreground line-clamp-3"><RichContentRenderer content={form.content} /></div>
                      )}
                      {(form.type === 'pdf' && form.pdfUrl) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <FileText className="h-3 w-3 text-orange-600" />
                          <span className="truncate">{form.pdfTitle || form.pdfUrl}</span>
                        </div>
                      )}
                      {(form.type === 'link' && form.linkUrl) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3 text-cyan-600" />
                          <span className="truncate">{form.linkLabel || form.linkUrl}</span>
                        </div>
                      )}
                      {form.thumbnail && (
                        <Image
                          src={form.thumbnail}
                          alt="Preview"
                          width={400}
                          height={150}
                          className="w-full max-h-24 object-cover rounded mt-1"
                          unoptimized
                        />
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {form.isPinned && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[9px] h-4 px-1 gap-0.5">
                            <Pin className="h-2 w-2" /> পিন
                          </Badge>
                        )}
                        {form.classLevel && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {classLevelLabels[form.classLevel] || form.classLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নোটিশ মুছুন</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই নোটিশ মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।</DialogDescription>
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
