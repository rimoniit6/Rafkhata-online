'use client'

import { Avatar,AvatarFallback,AvatarImage } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
AlertTriangle,
ArrowDown,
ArrowUp,
CheckCircle,
Edit,
Loader2,
MessageSquareQuote,
Plus,
Star,
Trash2,
User,
XCircle,
} from 'lucide-react'
import { useCallback,useEffect,useState } from 'react'

// ─── Data Model ───────────────────────────────────────────────
interface TestimonialRecord {
  id: string
  name: string
  role: string | null
  avatar: string | null
  content: string
  rating: number
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  name: '',
  role: '',
  avatar: '',
  content: '',
  rating: 5,
  order: 0,
  isActive: true,
}

// ─── Star Rating Component ────────────────────────────────────
function StarRating({
  rating,
  onChange,
  readonly = false,
}: {
  rating: number
  onChange?: (r: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              'h-5 w-5',
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Component ────────────────────────────────────────────────
export default function AdminTestimonialsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Fetch Testimonials ──
  const fetchTestimonials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const json = await res.json()
        setTestimonials(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  // ── Stats ──
  const stats = {
    total: testimonials.length,
    active: testimonials.filter((t) => t.isActive).length,
    inactive: testimonials.filter((t) => !t.isActive).length,
    avgRating: testimonials.length > 0
      ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
      : '0',
  }

  // ── Dialog helpers ──
  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm, order: testimonials.length })
    setDialogOpen(true)
  }

  const openEdit = (t: TestimonialRecord) => {
    setEditId(t.id)
    setForm({
      name: t.name,
      role: t.role || '',
      avatar: t.avatar || '',
      content: t.content,
      rating: t.rating,
      order: t.order,
      isActive: t.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: 'ত্রুটি', description: 'নাম এবং বিষয়বস্তু আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        avatar: form.avatar.trim() || null,
        content: form.content.trim(),
        rating: form.rating,
        order: form.order,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/testimonials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, ...body }),
          })
        : await fetch('/api/admin/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'টেস্টিমোনিয়াল আপডেট হয়েছে' : 'টেস্টিমোনিয়াল তৈরি হয়েছে' })
        setDialogOpen(false)
        fetchTestimonials()
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
      const res = await fetch(`/api/admin/testimonials?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'টেস্টিমোনিয়াল মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchTestimonials()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (t: TestimonialRecord) => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      })
      if (res.ok) {
        toast({ title: t.isActive ? 'টেস্টিমোনিয়াল নিষ্ক্রিয় করা হয়েছে' : 'টেস্টিমোনিয়াল সক্রিয় করা হয়েছে' })
        fetchTestimonials()
      }
    } catch {
      /* */
    }
  }

  const moveTestimonial = async (t: TestimonialRecord, direction: 'up' | 'down') => {
    const sorted = [...testimonials].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((item) => item.id === t.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swapWith) return

    try {
      await Promise.all([
        fetch('/api/admin/testimonials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id, order: swapWith.order }),
        }),
        fetch('/api/admin/testimonials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapWith.id, order: t.order }),
        }),
      ])
      fetchTestimonials()
    } catch {
      /* */
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
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
            <MessageSquareQuote className="h-6 w-6 text-emerald-600" />
            টেস্টিমোনিয়াল ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total}টি টেস্টিমোনিয়াল · গড় রেটিং {stats.avgRating}
          </p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> নতুন টেস্টিমোনিয়াল
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <MessageSquareQuote className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">মোট</p>
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
                <Star className="h-4 w-4 text-amber-600 fill-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                <p className="text-xs text-muted-foreground">গড় রেটিং</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testimonial Card Grid */}
      {testimonials.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquareQuote className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>কোনো টেস্টিমোনিয়াল পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn('overflow-hidden transition-all hover:shadow-md', !t.isActive && 'opacity-60')}>
                {/* Top color bar */}
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <CardContent className="p-4">
                  {/* Reorder + Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveTestimonial(t, 'up')}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveTestimonial(t, 'down')}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        disabled={idx === testimonials.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs text-muted-foreground ml-1">#{t.order}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleActive(t)}
                        title={t.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                      >
                        {t.isActive ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(t)}
                        title="সম্পাদনা"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(t.id)}
                        title="মুছুন"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-2">
                    <StarDisplay rating={t.rating} />
                  </div>

                  {/* Content */}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      &ldquo;{t.content.replace(/<[^>]*>/g, '')}&rdquo;
                    </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={t.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                        {t.name ? getInitials(t.name) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      {t.role && (
                        <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                      )}
                    </div>
                    <Badge
                      className={cn(
                        'ml-auto shrink-0 text-[10px] px-1.5 py-0',
                        t.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {t.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5 text-emerald-600" />
              {editId ? 'টেস্টিমোনিয়াল সম্পাদনা' : 'নতুন টেস্টিমোনিয়াল তৈরি করুন'}
            </DialogTitle>
            <DialogDescription>
              {editId ? 'টেস্টিমোনিয়াল এর তথ্য পরিবর্তন করুন' : 'নতুন টেস্টিমোনিয়াল যোগ করুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>নাম *</Label>
              <Input
                placeholder="ব্যক্তির নাম"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>পদবি / ভূমিকা</Label>
              <Input
                placeholder="যেমন: শিক্ষার্থী, অভিভাবক, শিক্ষক"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label>ছবি URL</Label>
              <Input
                placeholder="https://example.com/avatar.jpg"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">ঐচ্ছিক — ফাঁকা রাখলে ডিফল্ট আইকন দেখাবে</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>বিষয়বস্তু *</Label>
              <Textarea
                placeholder="টেস্টিমোনিয়াল লিখুন (বাংলায়)"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="resize-y"
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>রেটিং</Label>
              <StarRating rating={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
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
              disabled={saving || !form.name.trim() || !form.content.trim()}
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
              টেস্টিমোনিয়াল মুছুন
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই টেস্টিমোনিয়াল মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
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
