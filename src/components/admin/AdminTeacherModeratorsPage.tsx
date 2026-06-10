'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TeacherRecord {
  id: string
  name: string
  image: string | null
  title: string
  institution: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  name: '',
  image: '',
  title: '',
  institution: '',
  order: 0,
  isActive: true,
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminTeacherModeratorsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<TeacherRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/teacher-moderators')
      if (res.ok) {
        const json = await res.json()
        setTeachers(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const stats = {
    total: teachers.length,
    active: teachers.filter((t) => t.isActive).length,
    inactive: teachers.filter((t) => !t.isActive).length,
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm, order: teachers.length })
    setDialogOpen(true)
  }

  const openEdit = (t: TeacherRecord) => {
    setEditId(t.id)
    setForm({
      name: t.name,
      image: t.image || '',
      title: t.title,
      institution: t.institution || '',
      order: t.order,
      isActive: t.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim()) {
      toast({ title: 'ত্রুটি', description: 'নাম এবং পদবী আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        image: form.image.trim() || null,
        title: form.title.trim(),
        institution: form.institution.trim() || null,
        order: form.order,
        isActive: form.isActive,
      }

      const res = editId
        ? await fetch('/api/admin/teacher-moderators', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, ...body }),
          })
        : await fetch('/api/admin/teacher-moderators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editId ? 'তথ্য আপডেট হয়েছে' : 'শিক্ষক/মডারেটর যোগ করা হয়েছে' })
        setDialogOpen(false)
        fetchTeachers()
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
      const res = await fetch(`/api/admin/teacher-moderators?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchTeachers()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (t: TeacherRecord) => {
    try {
      const res = await fetch('/api/admin/teacher-moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      })
      if (res.ok) {
        toast({ title: t.isActive ? 'নিষ্ক্রিয় করা হয়েছে' : 'সক্রিয় করা হয়েছে' })
        fetchTeachers()
      }
    } catch {
      /* */
    }
  }

  const moveItem = async (t: TeacherRecord, direction: 'up' | 'down') => {
    const sorted = [...teachers].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((item) => item.id === t.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swapWith) return

    try {
      await Promise.all([
        fetch('/api/admin/teacher-moderators', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: t.id, order: swapWith.order }),
        }),
        fetch('/api/admin/teacher-moderators', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: swapWith.id, order: t.order }),
        }),
      ])
      fetchTeachers()
    } catch {
      /* */
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            শিক্ষক ও মডারেটর ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total} জন · সক্রিয় {stats.active} জন
          </p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> নতুন যোগ করুন
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
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
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>কোনো শিক্ষক বা মডারেটর পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t, idx) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn('overflow-hidden transition-all hover:shadow-md', !t.isActive && 'opacity-60')}>
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveItem(t, 'up')}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(t, 'down')}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        disabled={idx === teachers.length - 1}
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

                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={t.image || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                        {t.name ? getInitials(t.name) : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.title}</p>
                      {t.institution && (
                        <p className="text-xs text-muted-foreground/60 truncate">{t.institution}</p>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              {editId ? 'তথ্য সম্পাদনা' : 'নতুন শিক্ষক/মডারেটর যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editId ? 'শিক্ষক বা মডারেটরের তথ্য পরিবর্তন করুন' : 'নতুন শিক্ষক বা মডারেটর যোগ করুন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>নাম *</Label>
              <Input
                placeholder="পূর্ণ নাম"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>ছবি URL</Label>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">ঐচ্ছিক — ফাঁকা রাখলে ডিফল্ট আইকন দেখাবে</p>
            </div>

            <div className="space-y-2">
              <Label>পদবী *</Label>
              <Input
                placeholder="যেমন: প্রভাষক, সিনিয়র শিক্ষক, মডারেটর"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>প্রতিষ্ঠান</Label>
              <Input
                placeholder="যেমন: ঢাকা কলেজ, সরকারি বিজ্ঞান কলেজ"
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
              />
            </div>

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
              disabled={saving || !form.name.trim() || !form.title.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              নিশ্চিতকরণ
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই শিক্ষক/মডারেটরকে মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
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
