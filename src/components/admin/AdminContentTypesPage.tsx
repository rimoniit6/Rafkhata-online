'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { invalidateContentTypesCache } from '@/hooks/use-content-types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AnimatePresence,motion } from 'framer-motion'
import {
ArrowDown,
ArrowUp,
Check,
Edit,
Eye,EyeOff,
Loader2,
Plus,
RefreshCw,
Tags,
Trash2
} from 'lucide-react'
import { useCallback,useEffect,useState } from 'react'

interface ContentTypeItem {
  id: string
  key: string
  labelBn: string
  labelEn: string
  description: string | null
  icon: string
  color: string
  lightColor: string | null
  textColor: string | null
  route: string | null
  paramKey: string | null
  buttonLabel: string | null
  isActive: boolean
  order: number
}

const ICON_OPTIONS = [
  'PlayCircle', 'FileQuestion', 'ClipboardList', 'GraduationCap',
  'Lightbulb', 'Award', 'Package', 'Crown', 'BookOpen',
]

const COLOR_OPTIONS = [
  { value: 'bg-emerald-500', label: 'সবুজ' },
  { value: 'bg-teal-500', label: 'টিল' },
  { value: 'bg-amber-500', label: 'অ্যাম্বার' },
  { value: 'bg-rose-500', label: 'গোলাপি' },
  { value: 'bg-violet-500', label: 'ভায়োলেট' },
  { value: 'bg-sky-500', label: 'আকাশি' },
  { value: 'bg-orange-500', label: 'কমলা' },
  { value: 'bg-purple-500', label: 'বেগুনি' },
]

export default function AdminContentTypesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ContentTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    key: '',
    labelBn: '',
    labelEn: '',
    description: '',
    icon: 'BookOpen',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    route: '',
    paramKey: '',
    buttonLabel: '',
    isActive: true,
    order: 0,
  })

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-types')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(Array.isArray(data.data) ? data.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'কন্টেন্ট টাইপ আনতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const csrfRes = await fetch('/api/csrf-token')
      const csrfJson = await csrfRes.json()
      const token = csrfJson.token
      const res = await fetch('/api/content-types/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _csrf: token }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: json.message || 'সিড সম্পন্ন' })
        fetchItems()
      } else {
        toast({ title: json.error || 'সিড করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'সিড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally { setSeeding(false) }
  }

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const resetForm = () => {
    setForm({
      key: '', labelBn: '', labelEn: '', description: '',
      icon: 'BookOpen', color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      route: '', paramKey: '', buttonLabel: '',
      isActive: true, order: 0,
    })
    setEditId(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (item: ContentTypeItem) => {
    setEditId(item.id)
    setForm({
      key: item.key,
      labelBn: item.labelBn,
      labelEn: item.labelEn,
      description: item.description || '',
      icon: item.icon,
      color: item.color,
      lightColor: item.lightColor || '',
      textColor: item.textColor || '',
      route: item.route || '',
      paramKey: item.paramKey || '',
      buttonLabel: item.buttonLabel || '',
      isActive: item.isActive,
      order: item.order,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.key || !form.labelBn || !form.labelEn || !form.icon || !form.color) {
      toast({ title: 'ত্রুটি', description: 'key, বাংলা লেবেল, ইংরেজি লেবেল, আইকন ও রং আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const url = '/api/admin/content-types'
      const method = editId ? 'PUT' : 'POST'
      const body = editId
        ? { id: editId, ...form }
        : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      // Invalidate frontend cache
      invalidateContentTypesCache()

      toast({
        title: editId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে',
        description: editId ? 'কন্টেন্ট টাইপ আপডেট হয়েছে' : 'নতুন কন্টেন্ট টাইপ তৈরি হয়েছে',
      })

      setDialogOpen(false)
      resetForm()
      fetchItems()
    } catch (err) {
      toast({
        title: 'ত্রুটি',
        description: (err as Error).message || 'সংরক্ষণ করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (item: ContentTypeItem) => {
    try {
      const res = await fetch('/api/admin/content-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error('Failed')

      invalidateContentTypesCache()
      toast({ title: item.isActive ? 'নিষ্ক্রিয় হয়েছে' : 'সক্রিয় হয়েছে' })
      fetchItems()
    } catch {
      toast({ title: 'ত্রুটি', description: 'আপডেট করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }

  const handleMoveOrder = async (item: ContentTypeItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id)
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= items.length) return

    const swapItem = items[swapIndex]

    try {
      // Update both items
      await Promise.all([
        fetch('/api/admin/content-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, order: swapItem.order }),
        }),
        fetch('/api/admin/content-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapItem.id, order: item.order }),
        }),
      ])

      invalidateContentTypesCache()
      fetchItems()
    } catch {
      toast({ title: 'ত্রুটি', description: 'অর্ডার পরিবর্তন করতে সমস্যা', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/content-types?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')

      invalidateContentTypesCache()
      toast({ title: 'মুছে ফেলা হয়েছে' })
      setDeleteConfirm(null)
      fetchItems()
    } catch {
      toast({ title: 'ত্রুটি', description: 'মুছে ফেলতে সমস্যা', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="size-7 text-primary" />
            কন্টেন্ট টাইপ ম্যানেজমেন্ট
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            কন্টেন্ট টাইপ যোগ, সম্পাদনা ও অর্ডার পরিবর্তন করুন
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seeding} className="gap-2">
            <RefreshCw className={cn('size-4', seeding && 'animate-spin')} />
            {seeding ? 'সিড হচ্ছে...' : 'ডিফল্ট সিড'}
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="size-4" />
            নতুন কন্টেন্ট টাইপ
          </Button>
        </div>
      </div>

      {/* Content Types List */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`transition-all ${!item.isActive ? 'opacity-60' : 'hover:shadow-md'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveOrder(item, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(item, 'down')}
                        disabled={index === items.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>

                    {/* Color dot */}
                    <div className={`size-10 rounded-lg ${item.color} shrink-0 flex items-center justify-center text-white text-xs font-bold`}>
                      {item.order}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{item.labelBn}</h3>
                        <Badge variant="outline" className="text-xs font-mono">{item.key}</Badge>
                        <span className="text-xs text-muted-foreground">({item.labelEn})</span>
                        {!item.isActive && (
                          <Badge variant="secondary" className="text-xs">নিষ্ক্রিয়</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {item.description && <span>{item.description.replace(/<[^>]*>/g, '')}</span>}
                        {item.icon && <span className="font-mono">আইকন: {item.icon}</span>}
                        {item.route && <span className="font-mono">রুট: {item.route}</span>}
                        {item.buttonLabel && <span>বাটন: {item.buttonLabel}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                      >
                        {item.isActive ? (
                          <Eye className="size-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'কন্টেন্ট টাইপ সম্পাদনা' : 'নতুন কন্টেন্ট টাইপ'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Key */}
            <div className="space-y-2">
              <Label>Key (ইংরেজি, ইউনিক) *</Label>
              <Input
                value={form.key}
                onChange={(e) => setForm(f => ({ ...f, key: e.target.value.replace(/\s/g, '-').toLowerCase() }))}
                placeholder="mcq, lecture, cq..."
                disabled={!!editId}
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>বাংলা লেবেল *</Label>
                <Input
                  value={form.labelBn}
                  onChange={(e) => setForm(f => ({ ...f, labelBn: e.target.value }))}
                  placeholder="লেকচার"
                />
              </div>
              <div className="space-y-2">
                <Label>ইংরেজি লেবেল *</Label>
                <Input
                  value={form.labelEn}
                  onChange={(e) => setForm(f => ({ ...f, labelEn: e.target.value }))}
                  placeholder="Lecture"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>বিবরণ</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="ভিডিও ও লিখিত লেকচার"
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>আইকন *</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.icon === icon ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>রং *</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.color === c.value ? 'border-primary ring-1 ring-primary' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className={`size-3 rounded-full ${c.value}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Light Color & Text Color */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>হালকা রং (Light BG)</Label>
                <Input
                  value={form.lightColor}
                  onChange={(e) => setForm(f => ({ ...f, lightColor: e.target.value }))}
                  placeholder="bg-emerald-50 dark:bg-emerald-950/30"
                />
              </div>
              <div className="space-y-2">
                <Label>টেক্সট রং</Label>
                <Input
                  value={form.textColor}
                  onChange={(e) => setForm(f => ({ ...f, textColor: e.target.value }))}
                  placeholder="text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            {/* Route & Param Key */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>রুট</Label>
                <Input
                  value={form.route}
                  onChange={(e) => setForm(f => ({ ...f, route: e.target.value }))}
                  placeholder="lecture-viewer"
                />
              </div>
              <div className="space-y-2">
                <Label>প্যারাম কী</Label>
                <Input
                  value={form.paramKey}
                  onChange={(e) => setForm(f => ({ ...f, paramKey: e.target.value }))}
                  placeholder="lectureId"
                />
              </div>
            </div>

            {/* Button Label */}
            <div className="space-y-2">
              <Label>বাটন লেবেল</Label>
              <Input
                value={form.buttonLabel}
                onChange={(e) => setForm(f => ({ ...f, buttonLabel: e.target.value }))}
                placeholder="লেকচার দেখুন"
              />
            </div>

            {/* Order & Active */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>অর্ডার</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>সক্রিয়</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, isActive: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              বাতিল
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {editId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>মুছে ফেলার নিশ্চিতি</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            এই কন্টেন্ট টাইপ মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
