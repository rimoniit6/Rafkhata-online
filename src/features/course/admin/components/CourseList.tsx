'use client'

import { motion } from 'framer-motion'
import {
  Plus, Search, Edit3, Trash2, Crown, Loader2, BookOpen, Layers,
  ArrowLeft, ArrowRight,
} from 'lucide-react'
import SafeImage from '@/components/ui/safe-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { CourseRecord } from '@/services/api/course.service'

interface Props {
  courses: CourseRecord[]; loading: boolean; total: number
  page: number; totalPages: number; search: string
  filterStatus: string; deleteTarget: string | null
  onSearchChange: (v: string) => void
  onFilterStatusChange: (v: string) => void
  onPageChange: (p: number) => void
  onAdd: () => void
  onEdit: (c: CourseRecord) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

export default function CourseList({
  courses, loading, total, page, totalPages, search, filterStatus, deleteTarget,
  onSearchChange, onFilterStatusChange, onPageChange,
  onAdd, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="সার্চ..." value={search} onChange={e => onSearchChange(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-32"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="draft">ড্রাফট</SelectItem>
              <SelectItem value="published">পাবলিশড</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> নিউ কোর্স</Button>
      </div>

      <p className="text-sm text-muted-foreground">মোট {total}টি কোর্স</p>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">কোনো কোর্স নেই</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEdit(c)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {c.thumbnail ? <SafeImage src={c.thumbnail} alt="" width={80} height={56} className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6 text-muted-foreground/50" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate font-medium">{c.title}</h4>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                         <Badge variant={c.status === 'published' ? 'default' : 'outline'}>
                          {c.status === 'published' ? 'পাবলিশড' : 'ড্রাফট'}
                        </Badge>
                        {c.isPremium && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            <Crown className="mr-1 h-3 w-3" />
                            {c.originalPrice && c.originalPrice > 0 && c.originalPrice > (c.price || 0) ? (
                              <><span className="line-through text-[10px] opacity-70 mr-1">৳{c.originalPrice}</span> ৳{c.price}</>
                            ) : (
                              <>৳{c.price}</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {c._count && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{c._count.lessons} আইটেম</span>}
                      {c._count && <span>{c._count.purchases} ক্রয়</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(c) }}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteRequest(c.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ArrowLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={onDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কোর্স মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই কোর্স এবং এর সব আইটেম স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-red-600 hover:bg-red-700">মুছে ফেলুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
