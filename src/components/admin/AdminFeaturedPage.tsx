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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useContentTypes } from '@/hooks/use-content-types'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import {
AlignLeft,
ArrowDown,
ArrowUp,
BookOpen,
Box,
Check,
ClipboardCheck,
Edit,
Eye,
EyeOff,
FileQuestion,
GraduationCap,
GripVertical,
Lightbulb,
Loader2,
Package,
Plus,
Search,
Star,
Trash2,
X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

// Only these content types are supported by the featured system
const SUPPORTED_FEATURED_TYPES = new Set([
  'lecture', 'mcq', 'cq', 'bundle',
  'package', 'suggestion', 'exam', 'course',
])

// Fallback content type definitions (used before content types load from DB)
const FALLBACK_CONTENT_TYPES = [
  { value: 'lecture', label: 'লেকচার', icon: BookOpen, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'mcq', label: 'MCQ', icon: FileQuestion, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'cq', label: 'CQ', icon: AlignLeft, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'bundle', label: 'বান্ডেল', icon: Package, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  { value: 'package', label: 'প্যাকেজ', icon: Box, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  { value: 'suggestion', label: 'সাজেশন', icon: Lightbulb, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { value: 'exam', label: 'এক্সাম', icon: ClipboardCheck, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  { value: 'course', label: 'কোর্স', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
] as const

interface FeaturedItem {
  id: string
  contentType: string
  contentId: string
  title: string | null
  subtitle: string | null
  thumbnail: string | null
  section: string
  isActive: boolean
  order: number
  displayTitle: string
  displaySubtitle: string | null
  displayThumbnail: string | null
  isPremium: boolean
  contentExists: boolean
}

interface SearchItem {
  id: string
  title: string
  subtitle?: string | null
  thumbnail?: string | null
  isPremium?: boolean
  extra?: Record<string, unknown>
}

const emptyForm = {
  contentType: 'lecture',
  contentId: '',
  title: '',
  subtitle: '',
  thumbnail: '',
  section: 'homepage',
  isActive: true,
}

export default function AdminFeaturedPage() {
  const { toast } = useToast()
  const { contentTypesWithIcons } = useContentTypes()

  // Build CONTENT_TYPES dynamically from DB, filtered to supported types
  const CONTENT_TYPES = contentTypesWithIcons.length > 0
    ? contentTypesWithIcons
        .filter(ct => SUPPORTED_FEATURED_TYPES.has(ct.key))
        .map(ct => ({
          value: ct.key,
          label: ct.labelBn,
          icon: ct.Icon,
          color: `${ct.lightColor || 'bg-gray-100'} ${ct.textColor || 'text-gray-700'}`,
        }))
    : FALLBACK_CONTENT_TYPES
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedContent, setSelectedContent] = useState<SearchItem | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/featured?section=homepage')
      if (res.ok) {
        const json = await res.json()
        setItems(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Search content when type or query changes
  const searchContent = useCallback(async (type: string, q: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/featured/search?type=${type}&q=${encodeURIComponent(q)}&limit=20`)
      if (res.ok) {
        const json = await res.json()
        setSearchResults(Array.isArray(json.data) ? json.data : [])
      } else {
        const json = await res.json().catch(() => ({}))
        toast({ title: 'সার্চ ব্যর্থ', description: json.error || 'কন্টেন্ট খুঁজতে সমস্যা হয়েছে', variant: 'destructive' })
        setSearchResults([])
      }
    } catch {
      toast({ title: 'সার্চ ব্যর্থ', description: 'কন্টেন্ট খুঁজতে সমস্যা হয়েছে', variant: 'destructive' })
      setSearchResults([])
    }
    finally { setSearching(false) }
  }, [toast])

  // Debounced search
  useEffect(() => {
    if (!dialogOpen) return
    const timer = setTimeout(() => {
      searchContent(form.contentType, searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [dialogOpen, form.contentType, searchQuery, searchContent])

  // When content type changes, clear selected content and results
  const handleContentTypeChange = (type: string) => {
    setForm({ ...form, contentType: type, contentId: '', title: '', subtitle: '', thumbnail: '' })
    setSelectedContent(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const selectContent = (item: SearchItem) => {
    setSelectedContent(item)
    setForm({
      ...form,
      contentId: item.id,
      title: item.title,
      subtitle: item.subtitle || '',
      thumbnail: item.thumbnail || '',
    })
  }

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setSelectedContent(null)
    setSearchQuery('')
    setSearchResults([])
    setDialogOpen(true)
  }

  const openEdit = (item: FeaturedItem) => {
    setEditId(item.id)
    setForm({
      contentType: item.contentType,
      contentId: item.contentId,
      title: item.title || '',
      subtitle: item.subtitle || '',
      thumbnail: item.thumbnail || '',
      section: item.section,
      isActive: item.isActive,
    })
    setSelectedContent({
      id: item.contentId,
      title: item.title || '',
      subtitle: item.subtitle,
      thumbnail: item.thumbnail,
    })
    setSearchQuery('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.contentType || !form.contentId) {
      toast({ title: 'ত্রুটি', description: 'কন্টেন্ট টাইপ এবং কন্টেন্ট নির্বাচন আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        contentType: form.contentType,
        contentId: form.contentId,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        thumbnail: form.thumbnail || undefined,
        section: form.section,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/featured', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/featured', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'ফিচার্ড কন্টেন্ট আপডেট হয়েছে' : 'ফিচার্ড কন্টেন্ট যোগ হয়েছে' })
        setDialogOpen(false)
        fetchItems()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/featured?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'ফিচার্ড কন্টেন্ট মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchItems() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const toggleActive = async (item: FeaturedItem) => {
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      })
      if (res.ok) fetchItems()
    } catch { /* */ }
  }

  const moveOrder = async (item: FeaturedItem, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === item.id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === items.length - 1) return

    const swapWith = direction === 'up' ? items[idx - 1] : items[idx + 1]
    if (!swapWith) return

    try {
      // Swap orders
      await Promise.all([
        fetch('/api/admin/featured', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, order: swapWith.order }),
        }),
        fetch('/api/admin/featured', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapWith.id, order: item.order }),
        }),
      ])
      fetchItems()
    } catch { /* */ }
  }

  const getTypeInfo = (type: string) => {
    return CONTENT_TYPES.find((t) => t.value === type) || CONTENT_TYPES[0]
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-emerald-600" /> ফিচার্ড কন্টেন্ট
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            হোমপেজে প্রদর্শিত কন্টেন্ট পরিচালনা করুন • মোট {items.length}টি আইটেম
          </p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> নতুন ফিচার্ড কন্টেন্ট
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>ফিচার্ড কন্টেন্ট</strong> হোমপেজের &quot;ফিচার্ড কন্টেন্ট&quot; সেকশনে প্রদর্শিত হয়। আপনি যেকোনো ধরনের কন্টেন্ট (লেকচার, MCQ, CQ, বান্ডেল, প্যাকেজ, সাজেশন, এক্সাম) ফিচার্ড হিসেবে যোগ করতে পারেন। অর্ডার পরিবর্তন করে প্রদর্শন ক্রম নিয়ন্ত্রণ করুন।
          </p>
        </CardContent>
      </Card>

      {/* Featured Items List */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const typeInfo = getTypeInfo(item.contentType)
          const TypeIcon = typeInfo.icon
          return (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`overflow-hidden ${!item.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Order & Drag */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveOrder(item, 'up')}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => moveOrder(item, 'down')}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-30"
                        disabled={idx === items.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.displayThumbnail || item.thumbnail ? (
                        <Image src={item.displayThumbnail || item.thumbnail || ''} alt={item.title || 'Featured content'} fill className="object-cover" unoptimized />
                      ) : (
                        <TypeIcon className="w-6 h-6 text-emerald-600/60 dark:text-emerald-400/60" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${typeInfo.color} shrink-0 text-xs`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        {item.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shrink-0 text-xs">সক্রিয়</Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 text-xs">নিষ্ক্রিয়</Badge>
                        )}
                        {item.isPremium && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 shrink-0 text-xs">প্রিমিয়াম</Badge>
                        )}
                        {!item.contentExists && (
                          <Badge variant="destructive" className="shrink-0 text-xs">কন্টেন্ট মুছে ফেলা হয়েছে</Badge>
                        )}
                        {item.title && item.title !== item.displayTitle && (
                          <Badge variant="outline" className="shrink-0 text-xs">কাস্টম শিরোনাম</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{item.displayTitle}</h3>
                      {(item.displaySubtitle || item.subtitle) && (
                        <p className="text-xs text-muted-foreground truncate">{item.displaySubtitle || item.subtitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">অর্ডার: {item.order}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item)} aria-label="সক্রিয়/নিষ্ক্রিয়">
                        {item.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)} aria-label="সম্পাদনা">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)} aria-label="মুছুন">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
        {items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">কোনো ফিচার্ড কন্টেন্ট নেই</p>
            <p className="text-sm mt-1">হোমপেজে দেখানোর জন্য কন্টেন্ট ফিচার্ড হিসেবে যোগ করুন</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'ফিচার্ড কন্টেন্ট সম্পাদনা' : 'নতুন ফিচার্ড কন্টেন্ট যোগ করুন'}</DialogTitle>
            <DialogDescription>
              {editId ? 'ফিচার্ড কন্টেন্টের তথ্য পরিবর্তন করুন' : 'হোমপেজে দেখানোর জন্য কন্টেন্ট নির্বাচন করুন'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Step 1: Select Content Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ধাপ ১: কন্টেন্ট টাইপ নির্বাচন করুন</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTENT_TYPES.map((ct) => {
                  const Icon = ct.icon
                  const isSelected = form.contentType === ct.value
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => handleContentTypeChange(ct.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{ct.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Search & Select Content */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ধাপ ২: কন্টেন্ট খুঁজুন ও নির্বাচন করুন</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="কন্টেন্ট খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Selected content indicator */}
              {selectedContent && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedContent.title}</p>
                    {selectedContent.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{selectedContent.subtitle}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      setSelectedContent(null)
                      setForm({ ...form, contentId: '', title: '', subtitle: '', thumbnail: '' })
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Search results */}
              {!selectedContent && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      কোনো কন্টেন্ট পাওয়া যায়নি
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectContent(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {result.thumbnail ? (
                            <Image src={result.thumbnail} alt={result.title || 'Content thumbnail'} fill className="object-cover" unoptimized />
                          ) : (
                            <span className="text-xs font-bold text-emerald-600">
                              {form.contentType.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                        </div>
                        {result.isPremium && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs shrink-0">প্রিমিয়াম</Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Customize Display */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">ধাপ ৩: প্রদর্শন কাস্টমাইজ করুন (ঐচ্ছিক)</Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">কাস্টম শিরোনাম (খালি রাখলে মূল শিরোনাম দেখাবে)</Label>
                <Input
                  placeholder="কাস্টম শিরোনাম..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">সাবটাইটেল (যেমন: ক্লাস › বিষয়)</Label>
                <Input
                  placeholder="সাবটাইটেল..."
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <ImageUploader
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                label="কাস্টম থাম্বনেইল (খালি রাখলে মূল থাম্বনেইল দেখাবে)"
                placeholder="কাস্টম থাম্বনেইল আপলোড করুন"
              />

              <div className="flex items-center justify-between pt-2">
                <Label>সক্রিয়</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving || !form.contentId}
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট' : 'যোগ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ফিচার্ড কন্টেন্ট মুছুন</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই ফিচার্ড কন্টেন্ট মুছে ফেলতে চান?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDelete}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
