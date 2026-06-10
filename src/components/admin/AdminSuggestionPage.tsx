'use client'

import React, { useState, useEffect, useCallback } from 'react'
// framer-motion removed from editor — replaced with static divs to prevent cursor-jump / remount bug
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Lightbulb,
  Crown,
  FileText,
  Image as ImageIcon,
  Sigma,
  Eye,
  ArrowLeft,
  Sparkles,
  Table2,
  Code2,
  Type,
  Heading1,
  Save,
  X,
  LayoutGrid,
  List,
  MoreVertical,
  BookOpen,
  Hash,
  Power,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import ImageUploader from '@/components/ui/image-uploader'
import ContentBlockEditor, {
  ContentBlock,
  serializeBlocks,
  deserializeBlocks,
} from '@/components/ui/content-block-editor'
import { processContentBlocks } from '@/lib/math-converter'
import { cn } from '@/lib/utils'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Types ──────────────────────────────────────────────────────

interface SuggestionRecord {
  id: string
  title: string
  slug: string
  content: string
  classId: string | null
  subjectId: string | null
  chapterId: string | null
  thumbnail: string | null
  pdfUrl: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
  viewCount: number
  class?: { id: string; name: string; slug: string }
  subject?: { id: string; name: string; slug: string; classId: string }
  chapter?: { id: string; name: string; slug: string; subjectId: string }
}

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string; classId: string }
interface ChapterItem { id: string; name: string; slug: string; subjectId: string }



const blockTypeIcons: Record<string, React.ElementType> = {
  math: Sigma,
  image: ImageIcon,
  data: Table2,
  code: Code2,
  heading: Heading1,
  text: Type,
  divider: Sparkles,
  pdf: FileText,
}

const blockTypeLabels: Record<string, string> = {
  math: 'ম্যাথ',
  image: 'ছবি',
  data: 'ডাটা',
  code: 'কোড',
  heading: 'হেডিং',
  text: 'টেক্সট',
  divider: 'বিভাজক',
  pdf: 'পিডিএফ',
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminSuggestionPage() {
  const { toast } = useToast()
  const { classLevelLabels } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Filters
  const [filterClassId, setFilterClassId] = useState('')
  const [filterIsPremium, setFilterIsPremium] = useState('')

  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([])
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formPrice, setFormPrice] = useState('')
  const [formOrder, setFormOrder] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(j => setClasses(Array.isArray(j.data) ? j.data : [])).catch(() => {})
  }, [])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      setSubjects(Array.isArray((await res.json()).data) ? (await res.json()).data : [])
    } catch { /* */ }
  }, [])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      setChapters(Array.isArray((await res.json()).data) ? (await res.json()).data : [])
    } catch { /* */ }
  }, [])

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterClassId) params.set('classId', filterClassId)
      if (filterIsPremium) params.set('isPremium', filterIsPremium)
      params.set('page', '1')
      params.set('limit', '20')
      const res = await fetch(`/api/admin/suggestions?${params}`)
      if (res.ok) {
        const json = await res.json()
        const suggestionsData = json.data?.suggestions ?? json.data ?? []
        setSuggestions(suggestionsData)
        setTotal(json.data?.pagination?.total ?? json.pagination?.total ?? 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [search, filterClassId, filterIsPremium])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  // Cascade: classId -> subjects
  useEffect(() => {
    if (formClassId) { fetchSubjects(formClassId); setFormSubjectId(''); setFormChapterId('') }
    else { setSubjects([]); setChapters([]) }
  }, [formClassId, fetchSubjects])

  // Cascade: subjectId -> chapters
  useEffect(() => {
    if (formSubjectId) { fetchChapters(formSubjectId); setFormChapterId('') }
    else { setChapters([]) }
  }, [formSubjectId, fetchChapters])

  const resetForm = () => {
    setFormTitle('')
    setFormClassId('')
    setFormSubjectId('')
    setFormChapterId('')
    setFormBlocks([])
    setFormPdfUrl('')
    setFormThumbnail('')
    setFormIsPremium(false)
    setFormPrice('')
    setFormOrder('')
    setFormIsActive(true)
    setSubjects([])
    setChapters([])
    setEditorTab('edit')
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (suggestion: SuggestionRecord) => {
    setEditId(suggestion.id)
    setFormTitle(suggestion.title)
    setFormBlocks(deserializeBlocks(suggestion.content))
    setFormPdfUrl(suggestion.pdfUrl || '')
    setFormThumbnail(suggestion.thumbnail || '')
    setFormIsPremium(suggestion.isPremium)
    setFormPrice(suggestion.price ? String(suggestion.price) : '')
    setFormOrder(String(suggestion.order))
    setFormIsActive(suggestion.isActive)

    // Load cascade selects
    if (suggestion.class?.id) {
      setFormClassId(suggestion.class.id)
      fetchSubjects(suggestion.class.id)
    } else if (suggestion.class?.slug) {
      // Fallback: look up by slug
      setFormClassId(suggestion.class.slug)
      fetchSubjects(suggestion.class.slug)
    } else {
      setFormClassId('')
    }
    if (suggestion.subject?.id) {
      setFormSubjectId(suggestion.subject.id)
      fetchChapters(suggestion.subject.id)
    } else {
      setFormSubjectId('')
    }
    if (suggestion.chapterId) {
      setFormChapterId(suggestion.chapterId)
    } else {
      setFormChapterId('')
    }

    setEditorTab('edit')
    setViewMode('editor')
  }

  const handleSave = async () => {
    if (!formTitle) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formTitle,
        content: formBlocks.length > 0 ? serializeBlocks(processContentBlocks(formBlocks)) : '<p>কন্টেন্ট যোগ করা হবে</p>',
        classId: formClassId || undefined,
        subjectId: formSubjectId || undefined,
        chapterId: formChapterId || undefined,
        thumbnail: formThumbnail || undefined,
        pdfUrl: formPdfUrl || undefined,
        isPremium: formIsPremium,
        price: formIsPremium ? parseFloat(formPrice) || 0 : 0,
        order: parseInt(formOrder) || 0,
        isActive: formIsActive,
      }

      const res = editId
        ? await fetch('/api/admin/suggestions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'সাজেশন আপডেট হয়েছে' : 'সাজেশন তৈরি হয়েছে' })
        setViewMode('list')
        fetchSuggestions()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/suggestions?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'সাজেশন মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchSuggestions() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const getContentPreview = (content: string) => {
    const stripMarkup = (text: string) =>
      text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    try {
      const blocks = deserializeBlocks(content)
      const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'heading' || b.type === 'math')
      if (textBlocks.length > 0) {
        const first = textBlocks[0] as { content: string }
        const plain = stripMarkup(first.content)
        return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
      }
    } catch { /* */ }
    const plain = stripMarkup(content || '')
    return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
  }

  const getBlockTypeBadges = (content: string) => {
    try {
      const blocks = deserializeBlocks(content)
      if (blocks.length > 0) {
        return [...new Set(blocks.map(b => b.type))]
      }
    } catch { /* */ }
    return []
  }

  // ─── LIST VIEW ────────────────────────────────────────────────

  const ListView = () => {
    if (loading && suggestions.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        </div>
      )
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
                <Lightbulb className="h-5 w-5" />
              </div>
              সাজেশন ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি সাজেশন</p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl hover:shadow-violet-600/30"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন সাজেশন
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="সাজেশন খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-card border-border/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger className="h-10 w-[140px] bg-card border-border/50">
                <SelectValue placeholder="সব ক্লাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ক্লাস</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterIsPremium} onValueChange={setFilterIsPremium}>
              <SelectTrigger className="h-10 w-[140px] bg-card border-border/50">
                <SelectValue placeholder="সব ধরন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ধরন</SelectItem>
                <SelectItem value="free">ফ্রি</SelectItem>
                <SelectItem value="premium">প্রিমিয়াম</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center bg-card border border-border/50 rounded-lg p-0.5">
            <Button
              variant={viewStyle === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewStyle('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewStyle === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewStyle('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions Grid/List */}
        <AnimatePresence mode="wait">
          {viewStyle === 'grid' ? (
            <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card className={cn(
                    'hover:shadow-lg transition-all duration-300 border-border/50 h-full overflow-hidden',
                    'border-l-4',
                    suggestion.isPremium
                      ? 'border-l-amber-400 hover:shadow-amber-500/5'
                      : 'border-l-emerald-400 hover:shadow-emerald-500/5',
                  )}>
                    {/* Thumbnail or gradient header */}
                    {suggestion.thumbnail ? (
                      <div className="relative h-36 overflow-hidden">
                        <img src={suggestion.thumbnail} alt={suggestion.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-md">{suggestion.title}</h3>
                        </div>
                        {suggestion.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                        {!suggestion.isActive && (
                          <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                            নিষ্ক্রিয়
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className={cn(
                        'h-28 relative flex items-center justify-center',
                        suggestion.isPremium
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                          : 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
                      )}>
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                          <Lightbulb className="h-8 w-8 text-violet-600/60" />
                        </div>
                        {suggestion.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                        {!suggestion.isActive && (
                          <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                            নিষ্ক্রিয়
                          </Badge>
                        )}
                      </div>
                    )}

                    <CardContent className="p-4">
                      {!suggestion.thumbnail && (
                        <h3 className="font-semibold text-sm line-clamp-1 mb-2">{suggestion.title}</h3>
                      )}

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                        {getContentPreview(suggestion.content)}
                      </p>

                      {/* Block type badges */}
                      {(() => {
                        const types = getBlockTypeBadges(suggestion.content)
                        if (types.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {types.map(t => {
                                const BIcon = blockTypeIcons[t]
                                return (
                                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 bg-muted/80">
                                    {BIcon && <BIcon className="h-2.5 w-2.5" />}
                                    {blockTypeLabels[t] || t}
                                  </Badge>
                                )
                              })}
                            </div>
                          )
                        }
                        return null
                      })()}

                      {/* Meta info */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                        {suggestion.class && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {classLevelLabels[suggestion.class.slug] || suggestion.class.name}
                          </Badge>
                        )}
                        {suggestion.subject && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {suggestion.subject.name}
                          </Badge>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" /> {suggestion.viewCount}
                        </span>
                        {suggestion.pdfUrl && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="h-3 w-3" /> PDF
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {suggestion.isPremium ? `৳${suggestion.price}` : 'ফ্রি'}
                          </Badge>
                          {suggestion.order > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                              <Hash className="h-2.5 w-2.5" /> {suggestion.order}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-50 dark:hover:bg-violet-950/30" onClick={() => openEdit(suggestion)} title="সম্পাদনা">
                            <Edit className="h-3.5 w-3.5 text-violet-600" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(suggestion)}>
                                <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(suggestion.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> মুছুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {suggestions.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো সাজেশন পাওয়া যায়নি</p>
                  <p className="text-sm mt-1">নতুন সাজেশন তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className={cn(
                    'hover:shadow-md transition-all border-border/50 cursor-pointer border-l-4',
                    suggestion.isPremium ? 'border-l-amber-400' : 'border-l-emerald-400',
                  )} onClick={() => openEdit(suggestion)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        {suggestion.thumbnail ? (
                          <img src={suggestion.thumbnail} alt={suggestion.title} className="w-14 h-14 rounded-lg object-cover" />
                        ) : (
                          <div className={cn(
                            'w-14 h-14 rounded-lg flex items-center justify-center',
                            suggestion.isPremium
                              ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                              : 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
                          )}>
                            <Lightbulb className="h-5 w-5 text-violet-600/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm line-clamp-1">{suggestion.title}</h3>
                          {suggestion.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          {!suggestion.isActive && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-100 dark:bg-gray-800">নিষ্ক্রিয়</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {suggestion.class && (
                            <span>{classLevelLabels[suggestion.class.slug] || suggestion.class.name}</span>
                          )}
                          {suggestion.subject && (
                            <><span>·</span><span>{suggestion.subject.name}</span></>
                          )}
                          {suggestion.chapter && (
                            <><span>·</span><span>{suggestion.chapter.name}</span></>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {suggestion.viewCount}</span>
                        </div>
                      </div>

                      {/* Block types */}
                      <div className="hidden sm:flex items-center gap-1">
                        {getBlockTypeBadges(suggestion.content).slice(0, 4).map(t => {
                          const BIcon = blockTypeIcons[t]
                          return BIcon ? (
                            <div key={t} className="p-1 rounded bg-muted/80">
                              <BIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Price badge */}
                      <div className="hidden sm:flex items-center">
                        <Badge variant={suggestion.isPremium ? 'default' : 'secondary'} className={cn(
                          'text-[10px] h-5',
                          suggestion.isPremium && 'bg-amber-500 text-white',
                        )}>
                          {suggestion.isPremium ? `৳${suggestion.price}` : 'ফ্রি'}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 dark:hover:bg-violet-950/30" onClick={(e) => { e.stopPropagation(); openEdit(suggestion) }}>
                          <Edit className="h-4 w-4 text-violet-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(suggestion.id) }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো সাজেশন পাওয়া যায়নি</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ─── INLINE EDITOR VIEW ───────────────────────────────────────

  const EditorView = () => (
    <div className="space-y-0">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => { setViewMode('list'); resetForm() }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <><Edit className="h-5 w-5 text-violet-600" /> সাজেশন সম্পাদনা</>
              ) : (
                <><Sparkles className="h-5 w-5 text-violet-600" /> নতুন সাজেশন যোগ করুন</>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ব্লক-ভিত্তিক কন্টেন্ট এডিটর দিয়ে সাজেশন তৈরি করুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-600/20"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'তৈরি করুন'}</>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Body - Two Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Title Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-violet-600" /> মৌলিক তথ্য
              </Label>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>শিরোনাম *</Label>
                <Input
                  placeholder="সাজেশনের শিরোনাম লিখুন..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Class → Subject → Chapter cascade (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">ক্লাস (ঐচ্ছিক)</Label>
                  <Select value={formClassId} onValueChange={setFormClassId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">বিষয় (ঐচ্ছিক)</Label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId || formClassId === 'none'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">অধ্যায় (ঐচ্ছিক)</Label>
                  <Select value={formChapterId} onValueChange={setFormChapterId} disabled={!formSubjectId || formSubjectId === 'none'}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">নেই</SelectItem>
                      {chapters.map((ch) => (<SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Thumbnail */}
              <ImageUploader
                value={formThumbnail}
                onChange={setFormThumbnail}
                label="থাম্বনেইল"
                placeholder="সাজেশনের থাম্বনেইল ছবি আপলোড করুন"
              />
            </CardContent>
          </Card>

          {/* Content Blocks Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 px-4 py-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-purple-600" /> কন্টেন্ট ব্লকসমূহ
                </Label>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Sigma className="h-3 w-3" /> $...$ ম্যাথ
                  <span className="opacity-40">|</span>
                  <ImageIcon className="h-3 w-3" /> ছবি
                  <span className="opacity-40">|</span>
                  <Table2 className="h-3 w-3" /> ডাটা
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              {/* Mobile tab toggle */}
              <div className="lg:hidden mb-4">
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'edit' | 'preview')}>
                  <TabsList className="w-full grid grid-cols-2 h-9">
                    <TabsTrigger value="edit" className="text-xs gap-1">
                      <Edit className="h-3 w-3" /> সম্পাদনা
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1">
                      <Eye className="h-3 w-3" /> প্রিভিউ
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className={cn(
                editorTab === 'preview' ? 'lg:hidden' : '',
                editorTab === 'edit' ? '' : 'hidden lg:block',
              )}>
                <ContentBlockEditor
                  blocks={formBlocks}
                  onChange={setFormBlocks}
                />
              </div>

              <div className={cn(
                editorTab === 'edit' ? 'hidden lg:block' : '',
                editorTab === 'preview' ? 'lg:hidden' : '',
              )}>
                {/* Mobile preview only */}
                <div className="lg:hidden prose prose-sm dark:prose-invert max-w-none">
                  <h2 className="text-lg font-bold mb-3">{formTitle || '(শিরোনাম)'}</h2>
                  {formThumbnail && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={formThumbnail} alt="" className="w-full max-h-48 object-cover" />
                    </div>
                  )}
                  <ContentBlockEditor blocks={formBlocks} onChange={setFormBlocks} previewMode />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 px-4 py-3 border-b border-border/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-600" /> সেটিংস
              </Label>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ImageUploader
                    value={formPdfUrl}
                    onChange={setFormPdfUrl}
                    label="PDF ফাইল"
                    placeholder="PDF ফাইল আপলোড করুন"
                    allowPdf
                    maxSize={10 * 1024 * 1024}
                  />
                <div className="space-y-2">
                  <Label className="text-xs">ক্রম (Order)</Label>
                  <Input type="number" placeholder="0" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} className="h-9" />
                </div>
              </div>

              <Separator />

              {/* Premium toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Crown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">প্রিমিয়াম কন্টেন্ট</Label>
                    <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
                  </div>
                </div>
                <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
              </div>
              {formIsPremium && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label className="text-xs">মূল্য (৳)</Label>
                  <Input placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="h-9" />
                </motion.div>
              )}

              <Separator />

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Power className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">সক্রিয়</Label>
                    <p className="text-xs text-muted-foreground">সাজেশনটি প্রকাশিত থাকবে</p>
                  </div>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview (2 cols, desktop only) */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-20">
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-violet-600" /> লাইভ প্রিভিউ
                </Label>
              </div>
              <ScrollArea className="max-h-[75vh]">
                <div className="p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3">{formTitle || '(শিরোনাম)'}</h2>

                    {/* Thumbnail */}
                    {formThumbnail && (
                      <div className="mb-4 rounded-lg overflow-hidden">
<img src={formThumbnail} alt={formTitle || 'সাজেশন থাম্বনেইল'} className="w-full max-h-48 object-cover" />
                      </div>
                    )}

                    {/* Class/Subject/Chapter info */}
                    {(formClassId || formSubjectId || formChapterId) && (
                      <div className="flex items-center gap-2 mb-4">
                        {formClassId && formClassId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {classes.find(c => c.slug === formClassId)?.name || formClassId}
                          </Badge>
                        )}
                        {formSubjectId && formSubjectId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {subjects.find(s => s.id === formSubjectId)?.name || ''}
                          </Badge>
                        )}
                        {formChapterId && formChapterId !== 'none' && (
                          <Badge variant="outline" className="text-[10px]">
                            {chapters.find(c => c.id === formChapterId)?.name || ''}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Content blocks preview */}
                    <ContentBlockEditor
                      blocks={formBlocks}
                      onChange={setFormBlocks}
                      previewMode
                    />

                    {formBlocks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg border-border/30">
                        <p className="text-sm text-muted-foreground">ব্লক যোগ করলে এখানে প্রিভিউ দেখা যাবে</p>
                      </div>
                    )}

                    {/* PDF indicator */}
                    {formPdfUrl && (
                      <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center gap-2 border border-red-200/30 dark:border-red-800/20">
                        <FileText className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium">PDF সংযুক্তি উপলব্ধ</span>
                      </div>
                    )}

                    {/* Premium indicator */}
                    {formIsPremium && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2 border border-amber-200/30 dark:border-amber-800/20">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium">প্রিমিয়াম কন্টেন্ট — ৳{formPrice || 0}</span>
                      </div>
                    )}

                    {/* Active status indicator */}
                    {!formIsActive && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/30 flex items-center gap-2 border border-gray-200/30 dark:border-gray-800/20">
                        <Power className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">নিষ্ক্রিয় — প্রকাশিত হবে না</span>
                      </div>
                    )}

                    {/* Order indicator */}
                    {parseInt(formOrder) > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center gap-2 border border-blue-200/30 dark:border-blue-800/20">
                        <Hash className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">ক্রম: {formOrder}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── DELETE CONFIRMATION ──────────────────────────────────────

  const DeleteConfirm = () => (
    <AnimatePresence>
      {!!deleteId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">সাজেশন মুছুন</h3>
              <p className="text-sm text-muted-foreground mb-6">আপনি কি নিশ্চিত যে এই সাজেশন মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="min-w-20">বাতিল</Button>
                <Button variant="destructive" onClick={handleDelete} className="min-w-20">মুছুন</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ─── MAIN RENDER ──────────────────────────────────────────────

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Use function calls instead of component instances to prevent remounting on every re-render */}
        {viewMode === 'list' ? (
          ListView()
        ) : (
          EditorView()
        )}
      </AnimatePresence>
      {DeleteConfirm()}
    </>
  )
}
