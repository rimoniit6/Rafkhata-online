'use client'

import React, { useState, useEffect, useCallback } from 'react'
// framer-motion removed — all animations replaced with static divs to prevent cursor-jump / opacity:0 remount bug
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Crown,
  Video,
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
  ChevronRight,
  ChevronLeft,
  Check,
  LayoutGrid,
  List,
  MoreVertical,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
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
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Types ──────────────────────────────────────────────────────

type StepNumber = 1 | 2 | 3

interface LectureRecord {
  id: string
  title: string
  slug: string
  chapterId: string
  content: string
  videoUrl: string | null
  audioUrl: string | null
  pdfUrl: string | null
  thumbnail: string | null
  duration: number
  isPremium: boolean
  price: number
  viewCount: number
  isActive: boolean
  chapter?: { id: string; name: string; subjectId: string; subject?: { id: string; name: string; classId: string; class?: { id: string; name: string; slug: string } } }
  _count?: { resources: number }
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
}

// ─── Step Config ────────────────────────────────────────────────

const steps: { num: StepNumber; label: string; icon: React.ElementType }[] = [
  { num: 1, label: 'মৌলিক তথ্য', icon: BookOpen },
  { num: 2, label: 'কন্টেন্ট ব্লক ও মিডিয়া', icon: LayoutGrid },
  { num: 3, label: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]

// ─── StepIndicator ──────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: StepNumber }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative overflow-x-auto">
        {/* Background connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted z-0" />
        {/* Active connecting line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
        />

        {steps.map((step) => {
          const isActive = step.num === currentStep
          const isCompleted = step.num < currentStep
          const Icon = step.icon

          return (
            <div key={step.num} className="flex flex-col items-center z-10 relative">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-background border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/20'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                  isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminLecturesPage() {
  const { toast } = useToast()
  const { classLevelLabels } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [lectures, setLectures] = useState<LectureRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([])
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formAudioUrl, setFormAudioUrl] = useState('')
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formPrice, setFormPrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(j => setClasses(Array.isArray(j.data) ? j.data : [])).catch(() => {
      toast({ title: 'ত্রুটি', description: 'ক্লাস লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    })
  }, [])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      setSubjects(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'বিষয় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      setChapters(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [])

  const fetchLectures = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      const res = await fetch(`/api/admin/lectures?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLectures(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'লেকচার লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetchLectures() }, [fetchLectures])

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
    setFormVideoUrl('')
    setFormAudioUrl('')
    setFormPdfUrl('')
    setFormThumbnail('')
    setFormDuration('')
    setFormIsPremium(false)
    setFormPrice('')
    setFormIsActive(true)
    setSubjects([])
    setChapters([])
    setCurrentStep(1)
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (lecture: LectureRecord) => {
    setEditId(lecture.id)
    setFormTitle(lecture.title)
    setFormChapterId(lecture.chapterId)
    setFormBlocks(deserializeBlocks(lecture.content))
    setFormVideoUrl(lecture.videoUrl || '')
    setFormAudioUrl(lecture.audioUrl || '')
    setFormPdfUrl(lecture.pdfUrl || '')
    setFormThumbnail(lecture.thumbnail || '')
    setFormDuration(String(lecture.duration))
    setFormIsPremium(lecture.isPremium)
    setFormPrice(lecture.price ? String(lecture.price) : '')
    setFormIsActive(lecture.isActive)
    const sub = lecture.chapter?.subject
    const cls = sub?.class
    if (cls?.id) {
      setFormClassId(cls.id)
      fetchSubjects(cls.id)
    } else if (cls?.slug) {
      const foundClass = classes.find(c => c.slug === cls.slug)
      if (foundClass) {
        setFormClassId(foundClass.id)
        fetchSubjects(foundClass.id)
      } else {
        setFormClassId(cls.slug)
        fetchSubjects(cls.slug)
      }
    }
    if (sub?.id) {
      setFormSubjectId(sub.id)
      fetchChapters(sub.id)
    }
    setCurrentStep(1)
    setViewMode('editor')
  }

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!formChapterId) {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formTitle,
        chapterId: formChapterId,
        content: formBlocks.length > 0 ? serializeBlocks(processContentBlocks(formBlocks)) : '<p>কন্টেন্ট যোগ করা হবে</p>',
        videoUrl: formVideoUrl || undefined,
        audioUrl: formAudioUrl || undefined,
        pdfUrl: formPdfUrl || undefined,
        thumbnail: formThumbnail || undefined,
        duration: parseInt(formDuration) || 0,
        isPremium: formIsPremium,
        price: formIsPremium ? parseFloat(formPrice) || 0 : 0,
        isActive: formIsActive,
      }

      const res = editId
        ? await fetch('/api/admin/lectures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/lectures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'লেকচার আপডেট হয়েছে' : 'লেকচার তৈরি হয়েছে' })
        setViewMode('list')
        fetchLectures()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'লেকচার সংরক্ষণ করতে সমস্যা হয়েছে। নেটওয়ার্ক সংযোগ পরীক্ষা করুন', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/lectures?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'লেকচার মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchLectures() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', description: 'লেকচার মুছতে সমস্যা হয়েছে', variant: 'destructive' }) }
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
    } catch { /* non-critical, just return fallback */ }
    const plain = stripMarkup(content || '')
    return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
  }

  const getBlockTypeBadges = (content: string) => {
    try {
      const blocks = deserializeBlocks(content)
      if (blocks.length > 0) {
        return [...new Set(blocks.map(b => b.type))]
      }
    } catch { /* non-critical, just return fallback */ }
    return []
  }

  // Step navigation helpers
  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      return !!(formTitle && formChapterId)
    }
    return true
  }

  const goNext = () => {
    if (currentStep < 3 && canGoNext()) setCurrentStep((s) => Math.min(s + 1, 3) as StepNumber)
  }

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => Math.max(s - 1, 1) as StepNumber)
  }

  // ─── LIST VIEW ────────────────────────────────────────────────

  const ListView = () => {
    if (loading && lectures.length === 0) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              লেকচার ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি লেকচার</p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন লেকচার যোগ করুন
          </Button>
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="লেকচার খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-card border-border/50"
            />
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

        {/* Lectures Grid/List */}
        {viewStyle === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lectures.map((lecture, idx) => (
              <div key={lecture.id} className="group">
                  <Card className="hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 border-border/50 h-full overflow-hidden">
                    {/* Thumbnail or gradient header */}
                    {lecture.thumbnail ? (
                      <div className="relative h-36 overflow-hidden">
                        <img src={lecture.thumbnail} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-md">{lecture.title}</h3>
                        </div>
                        {lecture.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className={cn(
                        'h-28 relative flex items-center justify-center',
                        'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
                      )}>
                        <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                          {lecture.videoUrl ? <Video className="h-8 w-8 text-emerald-600/60" /> : <FileText className="h-8 w-8 text-emerald-600/60" />}
                        </div>
                        {lecture.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 gap-1 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> প্রিমিয়াম
                          </Badge>
                        )}
                      </div>
                    )}

                    <CardContent className="p-4">
                      {!lecture.thumbnail && (
                        <h3 className="font-semibold text-sm line-clamp-1 mb-2">{lecture.title}</h3>
                      )}

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                        {getContentPreview(lecture.content)}
                      </p>

                      {/* Block type badges */}
                      {(() => {
                        const types = getBlockTypeBadges(lecture.content)
                        if (types.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {types.map(t => {
                                const BIcon = blockTypeIcons[t]
                                return (
                                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 bg-muted/80">
                                    {BIcon && <BIcon className="h-2.5 w-2.5" />}
                                    {t === 'math' && 'ম্যাথ'}
                                    {t === 'image' && 'ছবি'}
                                    {t === 'data' && 'ডাটা'}
                                    {t === 'code' && 'কোড'}
                                    {t === 'heading' && 'হেডিং'}
                                    {t === 'text' && 'টেক্সট'}
                                    {t === 'divider' && 'বিভাজক'}
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
                        {lecture.chapter?.subject?.class && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {classLevelLabels[lecture.chapter.subject.class.slug] || lecture.chapter.subject.class.name}
                          </Badge>
                        )}
                        {lecture.duration > 0 && <span>{lecture.duration} মিনিট</span>}
                        <span>{lecture.viewCount} ভিউ</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {lecture.videoUrl ? 'ভিডিও' : lecture.content ? 'কন্টেন্ট' : 'ড্রাফট'}
                          </Badge>
                          {!lecture.isActive && (
                            <Badge className="text-[10px] h-5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                              লুকানো
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => openEdit(lecture)} title="সম্পাদনা">
                            <Edit className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(lecture)}>
                                <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(lecture.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> মুছুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {lectures.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো লেকচার পাওয়া যায়নি</p>
                  <p className="text-sm mt-1">নতুন লেকচার তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {lectures.map((lecture, idx) => (
                <div key={lecture.id}>

                  <Card className="hover:shadow-md transition-all border-border/50 cursor-pointer" onClick={() => openEdit(lecture)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        {lecture.thumbnail ? (
                          <img src={lecture.thumbnail} alt={lecture.title} className="w-14 h-14 rounded-lg object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center">
                            {lecture.videoUrl ? <Video className="h-5 w-5 text-emerald-600/50" /> : <FileText className="h-5 w-5 text-emerald-600/50" />}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm line-clamp-1">{lecture.title}</h3>
                          {lecture.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                          {!lecture.isActive && (
                            <Badge className="text-[9px] h-4 px-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 shrink-0">
                              লুকানো
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {lecture.chapter?.subject?.class && (
                            <span>{classLevelLabels[lecture.chapter.subject.class.slug] || lecture.chapter.subject.class.name}</span>
                          )}
                          <span>·</span>
                          <span>{lecture.chapter?.name || '-'}</span>
                          {lecture.duration > 0 && <><span>·</span><span>{lecture.duration} মিনিট</span></>}
                        </div>
                      </div>

                      {/* Block types */}
                      <div className="hidden sm:flex items-center gap-1">
                        {getBlockTypeBadges(lecture.content).slice(0, 4).map(t => {
                          const BIcon = blockTypeIcons[t]
                          return BIcon ? (
                            <div key={t} className="p-1 rounded bg-muted/80">
                              <BIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                          ) : null
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={(e) => { e.stopPropagation(); openEdit(lecture) }}>
                          <Edit className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(lecture.id) }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {lectures.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">কোনো লেকচার পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          )}
      </div>
    )
  }

  // ─── EDITOR VIEW (3-STEP WIZARD) ──────────────────────────────

  const selectedClass = classes.find(c => c.id === formClassId)
  const selectedSubject = subjects.find(s => s.id === formSubjectId)
  const selectedChapter = chapters.find(c => c.id === formChapterId)

  const EditorView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setViewMode('list'); resetForm() }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {editId ? 'লেকচার সম্পাদনা' : 'নতুন লেকচার যোগ করুন'}
            </h1>
            <p className="text-sm text-muted-foreground">ধাপ {currentStep}/৩</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editId && (
            <Badge variant="outline" className="text-xs">ID: {editId.slice(-8)}</Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="p-6">
          <StepIndicator currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Step Content */}
        {/* ─── STEP 1: মৌলিক তথ্য ─── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  মৌলিক তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">শিরোনাম *</Label>
                  <Input
                    placeholder="লেকচারের শিরোনাম লিখুন..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={cn("h-11 text-base", !formTitle.trim() && currentStep === 1 && formTitle !== '' ? "border-red-400 focus:border-red-500" : "")}
                  />
                  {!formTitle.trim() && currentStep === 1 && formTitle !== '' && (
                    <p className="text-xs text-red-500">শিরোনাম আবশ্যক</p>
                  )}
                </div>

                {/* Class → Subject → Chapter cascade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">ক্লাস *</Label>
                    <Select value={formClassId} onValueChange={setFormClassId}>
                      <SelectTrigger className={cn("h-11 text-base", !formClassId && currentStep === 1 ? "border-red-400" : "")}>
                        <SelectValue placeholder="ক্লাস নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formClassId && currentStep === 1 && (
                      <p className="text-xs text-red-500">ক্লাস নির্বাচন করুন</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">বিষয় *</Label>
                    <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId}>
                      <SelectTrigger className={cn("h-11 text-base", formClassId && !formSubjectId && currentStep === 1 ? "border-red-400" : "")}>
                        <SelectValue placeholder="বিষয় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formClassId && !formSubjectId && currentStep === 1 && (
                      <p className="text-xs text-red-500">বিষয় নির্বাচন করুন</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">অধ্যায় *</Label>
                    <Select value={formChapterId} onValueChange={setFormChapterId} disabled={!formSubjectId}>
                      <SelectTrigger className={cn("h-11 text-base", formSubjectId && !formChapterId && currentStep === 1 ? "border-red-400" : "")}>
                        <SelectValue placeholder="অধ্যায় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formSubjectId && !formChapterId && currentStep === 1 && (
                      <p className="text-xs text-red-500">অধ্যায় নির্বাচন করুন</p>
                    )}
                  </div>
                </div>

                {/* Thumbnail */}
                <ImageUploader
                  value={formThumbnail}
                  onChange={setFormThumbnail}
                  label="থাম্বনেইল"
                  placeholder="লেকচারের থাম্বনেইল ছবি আপলোড করুন"
                />
              </CardContent>
            </Card>

            {(!formTitle || !formChapterId) && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                * শিরোনাম ও অধ্যায় আবশ্যক
              </p>
            )}
          </div>
        )}

        {/* ─── STEP 2: কন্টেন্ট ব্লক ও মিডিয়া ─── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Content Blocks Card */}
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LayoutGrid className="h-5 w-5 text-emerald-600" />
                    কন্টেন্ট ব্লকসমূহ
                  </CardTitle>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Sigma className="h-3 w-3" /> $...$ ম্যাথ
                    <span className="opacity-40">|</span>
                    <ImageIcon className="h-3 w-3" /> ছবি
                    <span className="opacity-40">|</span>
                    <Table2 className="h-3 w-3" /> ডাটা
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ContentBlockEditor
                  blocks={formBlocks}
                  onChange={setFormBlocks}
                />
              </CardContent>
            </Card>

            {/* Media & Settings Card */}
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-emerald-600" />
                  মিডিয়া ও সেটিংস
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">ভিডিও URL</Label>
                    <Input placeholder="https://youtube.com/watch?v=..." value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} className="h-11 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">অডিও URL</Label>
                    <Input placeholder="https://...mp3" value={formAudioUrl} onChange={(e) => setFormAudioUrl(e.target.value)} className="h-11 text-base" />
                  </div>
                  <ImageUploader
                    value={formPdfUrl}
                    onChange={setFormPdfUrl}
                    label="PDF ফাইল"
                    placeholder="PDF ফাইল আপলোড করুন বা টেনে আনুন"
                    allowPdf
                    maxSize={10 * 1024 * 1024}
                  />
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">সময়কাল (মিনিট)</Label>
                    <Input type="number" placeholder="0" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="h-11 text-base" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── STEP 3: প্রিভিউ ও প্রকাশ ─── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="border-2 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5 text-emerald-600" />
                    লেকচার প্রিভিউ
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {formIsPremium && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                        <Crown className="h-3 w-3" /> প্রিমিয়াম {formPrice ? `৳${formPrice}` : ''}
                      </Badge>
                    )}
                    {formVideoUrl && (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="h-3 w-3" /> ভিডিও
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Metadata row */}
                <div className="flex flex-wrap gap-2 text-sm">
                  {selectedClass && <Badge variant="outline">{selectedClass.name}</Badge>}
                  {selectedSubject && <Badge variant="outline">{selectedSubject.name}</Badge>}
                  {selectedChapter && <Badge variant="outline">{selectedChapter.name}</Badge>}
                  {parseInt(formDuration) > 0 && (
                    <Badge variant="outline">{formDuration} মিনিট</Badge>
                  )}
                </div>

                <Separator />

                {/* Title */}
                <div>
                  <h2 className="text-xl font-bold">{formTitle || '(শিরোনাম)'}</h2>
                </div>

                {/* Thumbnail */}
                {formThumbnail && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={formThumbnail} alt="থাম্বনেইল" className="w-full max-h-64 object-cover" />
                  </div>
                )}

                {/* Content blocks preview */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ContentBlockEditor
                    blocks={formBlocks}
                    onChange={setFormBlocks}
                    previewMode
                  />
                </div>

                {formBlocks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg border-border/30">
                    <p className="text-sm text-muted-foreground">কন্টেন্ট ব্লক যোগ করা হয়নি</p>
                  </div>
                )}

                {/* Media indicators */}
                {formVideoUrl && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2 border border-emerald-200/30 dark:border-emerald-800/20">
                    <Video className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium">ভিডিও লেকচার ({formDuration || 0} মিনিট)</span>
                  </div>
                )}
                {formAudioUrl && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center gap-2 border border-blue-200/30 dark:border-blue-800/20">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium">অডিও রিসোর্স উপলব্ধ</span>
                  </div>
                )}
                {formPdfUrl && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center gap-2 border border-red-200/30 dark:border-red-800/20">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium">PDF রিসোর্স উপলব্ধ</span>
                  </div>
                )}

                <Separator />

                {/* Premium toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">প্রিমিয়াম কন্টেন্ট</Label>
                      <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
                    </div>
                  </div>
                  <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
                </div>
                {formIsPremium && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">মূল্য (৳)</Label>
                    <Input placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="h-11 text-base" type="number" />
                  </div>
                )}

                {/* Active/Published toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <Eye className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">প্রকাশিত</Label>
                      <p className="text-xs text-muted-foreground">{formIsActive ? 'শিক্ষার্থীরা এই লেকচার দেখতে পাবে' : 'লেকচারটি লুকানো আছে, শিক্ষার্থীরা দেখতে পাবে না'}</p>
                    </div>
                  </div>
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                </div>
              </CardContent>
            </Card>

            {/* Publish Button */}
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{editId ? 'লেকচার আপডেট করুন' : 'লেকচার প্রকাশ করুন'}</p>
                      <p className="text-xs text-muted-foreground">
                        {editId ? 'পরিবর্তনগুলো সংরক্ষণ করুন' : 'সব তথ্য ঠিক থাকলে প্রকাশ করুন'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
                    ) : (
                      <><Save className="h-4 w-4" /> {editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Step Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={goPrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4" /> আগের ধাপ
        </Button>

        <div className="flex items-center gap-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                step.num === currentStep
                  ? 'bg-emerald-500 w-6'
                  : step.num < currentStep
                  ? 'bg-emerald-400'
                  : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {currentStep < 3 ? (
          <Button
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={goNext}
            disabled={!canGoNext()}
          >
            পরবর্তী ধাপ <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-[120px]" /> /* Spacer to balance layout on step 3 */
        )}
      </div>
    </div>
  )

  // ─── DELETE CONFIRMATION ──────────────────────────────────────

  const DeleteConfirm = () => (
    <>
      {!!deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">লেকচার মুছুন</h3>
              <p className="text-sm text-muted-foreground mb-6">আপনি কি নিশ্চিত যে এই লেকচার মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="min-w-20">বাতিল</Button>
                <Button variant="destructive" onClick={handleDelete} className="min-w-20">মুছুন</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // ─── MAIN RENDER ──────────────────────────────────────────────

  return (
    <>
      {viewMode === 'list' ? ListView() : EditorView()}
      {DeleteConfirm()}
    </>
  )
}
