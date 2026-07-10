'use client'

import Image from 'next/image'
import { Plus, Search, FileText, GraduationCap, BookOpen, Users, Power, Edit, Trash2, BookMarked } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { toDecimal } from '@/lib/decimal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CQExamPackageRecord } from '@/features/cq-exam/types'

interface ClassCategory {
  id: string
  name: string
  slug: string
}

const statusLabels: Record<string, string> = {
  'draft': 'ড্রাফট',
  'published': 'প্রকাশিত',
  'archived': 'আর্কাইভ',
}

const statusColors: Record<string, string> = {
  'draft': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'published': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'archived': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const statusOptions = [
  { value: '', label: 'সকল স্ট্যাটাস' },
  { value: 'draft', label: 'ড্রাফট' },
  { value: 'published', label: 'প্রকাশিত' },
  { value: 'archived', label: 'আর্কাইভ' },
] as const

interface CQPackageListProps {
  loading: boolean
  total: number
  packages: CQExamPackageRecord[]
  classes: ClassCategory[]
  search: string
  setSearch: (v: string) => void
  filterClassId: string
  setFilterClassId: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  onOpenCreate: () => void
  onOpenDetail: (pkg: CQExamPackageRecord) => void
  onToggleActive: (pkg: CQExamPackageRecord) => void
  onOpenEdit: (pkg: CQExamPackageRecord) => void
  onDelete: (pkgId: string) => void
}

export function CQPackageList({
  loading, total, packages, classes,
  search, setSearch, filterClassId, setFilterClassId, filterStatus, setFilterStatus,
  onOpenCreate, onOpenDetail, onToggleActive, onOpenEdit, onDelete
}: CQPackageListProps) {
  const activeSets = packages.filter(p => p.isActive).length
  const totalPurchases = packages.reduce((sum, p) => sum + (p._count?.purchases || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" /> CQ এক্সাম প্যাকেজ
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">মোট: {total}টি প্যাকেজ</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onOpenCreate}>
          <Plus className="h-4 w-4" /> নতুন প্যাকেজ
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <BookMarked className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট প্যাকেজ</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সক্রিয় সেট</p>
              <p className="text-xl font-bold">{activeSets}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট ক্রয়</p>
              <p className="text-xl font-bold">{totalPurchases}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="প্যাকেজ খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterClassId || '_all'} onValueChange={(v) => setFilterClassId(v === '_all' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">সকল শ্রেণি</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus || '_all'} onValueChange={(v) => setFilterStatus(v === '_all' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value || '_all'} value={opt.value || '_all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো CQ এক্সাম প্যাকেজ পাওয়া যায়নি</p>
          <p className="text-sm text-muted-foreground mt-1">নতুন প্যাকেজ তৈরি করুন বা ফিল্টার পরিবর্তন করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => {
            const discount = toDecimal(pkg.originalPrice) > 0 ? Math.round(((toDecimal(pkg.originalPrice) - toDecimal(pkg.price)) / toDecimal(pkg.originalPrice)) * 100) : 0

            return (
              <Card key={pkg.id} className={cn(
                "border-border/50 hover:shadow-md transition-all overflow-hidden cursor-pointer",
                !pkg.isActive && 'opacity-60'
              )} onClick={() => onOpenDetail(pkg)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {pkg.thumbnail ? (
                        <Image src={pkg.thumbnail} alt={pkg.title} fill className="object-cover" unoptimized />
                      ) : (
                        <FileText className="size-8 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{pkg.title}</h3>
                          {pkg.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pkg.description}</p>
                          )}
                        </div>
                        <Badge className={cn('text-xs shrink-0', statusColors[pkg.status] || statusColors['draft'])}>
                          {statusLabels[pkg.status] || pkg.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          <GraduationCap className="h-3 w-3" />
                          {pkg.class?.name}
                        </Badge>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <BookOpen className="h-3 w-3" />
                          {pkg.totalSets} সেট
                        </Badge>
                        {pkg.isPremium && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                            প্রিমিয়াম
                          </Badge>
                        )}
                        {pkg._count && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Users className="h-3 w-3" />
                            {pkg._count.purchases} ক্রেতা
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-emerald-600">৳{pkg.price}</span>
                            {pkg.originalPrice > pkg.price && (
                              <>
                                <span className="text-xs text-muted-foreground line-through">৳{pkg.originalPrice}</span>
                                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 text-[10px] px-1">
                                  {discount}% ছাড়
                                </Badge>
                              </>
                            )}
                          </div>
                          <Badge className={cn(
                            'text-xs',
                            pkg.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {pkg.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onToggleActive(pkg)}
                            title={pkg.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                          >
                            <Power className={cn('h-4 w-4', pkg.isActive ? 'text-emerald-600' : 'text-muted-foreground')} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onOpenEdit(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => onDelete(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
