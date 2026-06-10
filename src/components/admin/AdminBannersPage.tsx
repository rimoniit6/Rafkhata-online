'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageUploader from '@/components/ui/image-uploader'
import { useToast } from '@/hooks/use-toast'

interface BannerRecord {
  id: string
  title: string
  subtitle: string | null
  image: string | null
  link: string | null
  buttonText: string | null
  isActive: boolean
  order: number
  startDate: string | null
  endDate: string | null
}

const emptyForm = {
  title: '',
  subtitle: '',
  imageUrl: '',
  link: '',
  buttonText: '',
  isActive: true,
  startDate: '',
  endDate: '',
}

export default function AdminBannersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<BannerRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) {
        const json = await res.json()
        setBanners(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (banner: BannerRecord) => {
    setEditId(banner.id)
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.image || '',
      link: banner.link || '',
      buttonText: banner.buttonText || '',
      isActive: banner.isActive,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        image: form.imageUrl || undefined,
        link: form.link.trim() || undefined,
        buttonText: form.buttonText.trim() || undefined,
        isActive: form.isActive,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }

      const res = editId
        ? await fetch('/api/admin/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'নোটিশ আপডেট হয়েছে' : 'নোটিশ তৈরি হয়েছে' })
        setDialogOpen(false)
        fetchBanners()
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
      const res = await fetch(`/api/admin/banners?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'নোটিশ মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchBanners() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const toggleActive = async (banner: BannerRecord) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
      })
      if (res.ok) {
        toast({ title: banner.isActive ? 'নোটিশ নিষ্ক্রিয় করা হয়েছে' : 'নোটিশ সক্রিয় করা হয়েছে' })
        fetchBanners()
      }
    } catch { /* */ }
  }

  const moveBanner = async (banner: BannerRecord, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(b => b.id === banner.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swapWith) return

    try {
      // Swap orders
      await Promise.all([
        fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: banner.id, order: swapWith.order }),
        }),
        fetch('/api/admin/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapWith.id, order: banner.order }),
        }),
      ])
      fetchBanners()
    } catch { /* */ }
  }

  const activeBanners = banners.filter(b => b.isActive)
  const inactiveBanners = banners.filter(b => !b.isActive)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-emerald-600" />
            স্পেশাল নোটিশ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {banners.length}টি নোটিশ · সক্রিয় {activeBanners.length}টি
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'লিস্ট দেখুন' : 'প্রিভিউ'}
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" /> নতুন নোটিশ
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Megaphone className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">সাইট ভিজিটে পপআপ নোটিশ দেখানো হয়</p>
            <p className="text-emerald-700 dark:text-emerald-300 mt-1">
              এখানে তৈরি করা সক্রিয় নোটিশগুলো ইউজার সাইট ভিজিট করলে পপআপ হিসেবে দেখাবে।
              প্রতিটি নোটিশ সেশনে একবার দেখাবে এবং ইউজার বন্ধ করতে পারবে।
              তারিখ সেট করে নির্দিষ্ট সময়ের জন্য নোটিশ দেখাতে পারবেন।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Mode */}
      {previewMode && activeBanners.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-center min-h-[280px]">
              {/* Popup Preview */}
              <div className="w-full max-w-xs bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Megaphone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      বিশেষ নোটিশ
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {activeBanners[0].title}
                  </h3>
                  {activeBanners[0].subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {activeBanners[0].subtitle}
                    </p>
                  )}
                  {activeBanners[0].buttonText && (
                    <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg text-center">
                      {activeBanners[0].buttonText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">↑ ইউজার ভিজিট করলে এভাবে পপআপ দেখাবে</p>
          </CardContent>
        </Card>
      )}

      {/* Banner List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-1">
            সক্রিয় <Badge variant="secondary" className="ml-1 text-xs">{activeBanners.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-1">
            নিষ্ক্রিয় <Badge variant="secondary" className="ml-1 text-xs">{inactiveBanners.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1">
            সব <Badge variant="secondary" className="ml-1 text-xs">{banners.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {['active', 'inactive', 'all'].map((tab) => {
          const filteredBanners = tab === 'active'
            ? activeBanners
            : tab === 'inactive'
            ? inactiveBanners
            : banners

          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filteredBanners.map((banner, idx) => (
                <motion.div
                  key={banner.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`overflow-hidden transition-opacity ${!banner.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                          <button
                            onClick={() => moveBanner(banner, 'up')}
                            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveBanner(banner, 'down')}
                            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                            disabled={idx === filteredBanners.length - 1}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Preview */}
                        <div className="w-40 h-20 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 shrink-0 overflow-hidden flex flex-col">
                          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-1.5" />
                          <div className="flex items-center gap-1 mb-1">
                            <Megaphone className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                            <span className="text-[9px] font-semibold text-amber-600">বিশেষ নোটিশ</span>
                          </div>
                          <span className="text-[10px] font-medium truncate leading-tight">{banner.title}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{banner.title}</h3>
                            {banner.isActive ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shrink-0 text-[10px] px-1.5 py-0">সক্রিয়</Badge>
                            ) : (
                              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">নিষ্ক্রিয়</Badge>
                            )}
                            {banner.buttonText && (
                              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                                {banner.buttonText}
                              </Badge>
                            )}
                          </div>
                          {banner.subtitle && (
                            <p className="text-xs text-muted-foreground mb-1">{banner.subtitle}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {banner.link && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <ExternalLink className="h-3 w-3" />{banner.link}
                              </span>
                            )}
                            {(banner.startDate || banner.endDate) && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {banner.startDate ? new Date(banner.startDate).toLocaleDateString('bn-BD') : '...'} — {banner.endDate ? new Date(banner.endDate).toLocaleDateString('bn-BD') : '...'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(banner)} title={banner.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}>
                            {banner.isActive ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(banner)} title="সম্পাদনা">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(banner.id)} title="মুছুন">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {filteredBanners.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>কোনো {tab === 'active' ? 'সক্রিয়' : tab === 'inactive' ? 'নিষ্ক্রিয়' : ''} নোটিশ নেই</p>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-600" />
              {editId ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি করুন'}
            </DialogTitle>
            <DialogDescription>
              {editId ? 'নোটিশের তথ্য পরিবর্তন করুন' : 'পপআপে দেখানোর জন্য স্পেশাল নোটিশ তৈরি করুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>শিরোনাম *</Label>
              <Input
                placeholder="বিশেষ নোটিশের শিরোনাম লিখুন"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">এই টেক্সটটি পপআপ নোটিশে দেখাবে</p>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label>সাবটাইটেল</Label>
              <Input
                placeholder="বিস্তারিত বা অতিরিক্ত তথ্য"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">শিরোনামের নিচে বিস্তারিত হিসেবে দেখাবে</p>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label>লিংক</Label>
              <Input
                placeholder="/premium বা https://example.com"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ক্লিক করলে কোথায় যাবে — অভ্যন্তরীণ রুট (যেমন /premium) অথবা বাহ্যিক লিংক
              </p>
            </div>

            {/* Button Text */}
            <div className="space-y-2">
              <Label>বাটন টেক্সট</Label>
              <Input
                placeholder="আরও দেখুন"
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">ফাঁকা রাখলে বাটন দেখাবে না</p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>শুরুর তারিখ</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে এখনই দেখাবে</p>
              </div>
              <div className="space-y-2">
                <Label>শেষ তারিখ</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে অনির্দিষ্টকাল দেখাবে</p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm font-medium">সক্রিয় করুন</Label>
                <p className="text-xs text-muted-foreground">নিষ্ক্রিয় থাকলে পপআপে দেখাবে না</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              নোটিশ মুছুন
            </DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই নোটিশ মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।</DialogDescription>
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
