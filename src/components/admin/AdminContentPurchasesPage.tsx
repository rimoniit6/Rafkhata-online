'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Package,
  Users,
  UserX,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  Filter,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'

interface PurchaseRecord {
  id: string
  userId: string
  amount: number
  method: string
  transactionId: string
  contentType: string | null
  contentId: string | null
  contentTitle: string | null
  classLevel: string | null
  isActive: boolean
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string }
}

export default function AdminContentPurchasesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [contentTypeFilter, setContentTypeFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ totalPurchases: 0, activePurchases: 0, inactivePurchases: 0 })
  const [contentTypeLabels, setContentTypeLabels] = useState<Record<string, string>>({})
  const [typeStats, setTypeStats] = useState<Record<string, { total: number; active: number; inactive: number }>>({})
  const [detailPurchase, setDetailPurchase] = useState<PurchaseRecord | null>(null)
  const [toggleDialog, setToggleDialog] = useState<PurchaseRecord | null>(null)
  const [toggleReason, setToggleReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showTypeStats, setShowTypeStats] = useState(false)
  const limit = 20

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (contentTypeFilter !== 'all') params.set('contentType', contentTypeFilter)
      if (activeFilter !== 'all') params.set('isActive', activeFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/content-purchases?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPurchases(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
        setStats(json.stats || { totalPurchases: 0, activePurchases: 0, inactivePurchases: 0 })
        setContentTypeLabels(json.contentTypeLabels || {})
        setTypeStats(json.typeStats || {})
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'ক্রয়ের তথ্য লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, contentTypeFilter, activeFilter, search, toast])

  useEffect(() => { fetchPurchases() }, [fetchPurchases])

  const totalPages = Math.ceil(total / limit)

  const handleToggleActive = async () => {
    if (!toggleDialog) return
    setProcessing(true)
    try {
      const newIsActive = !toggleDialog.isActive
      const res = await fetch('/api/admin/content-purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: toggleDialog.id,
          isActive: newIsActive,
          reason: toggleReason,
        }),
      })
      if (res.ok) {
        toast({
          title: newIsActive ? 'ক্রয় সক্রিয় করা হয়েছে' : 'ক্রয় নিষ্ক্রিয় করা হয়েছে',
          description: `${toggleDialog.user?.name} এর ক্রয় ${newIsActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
        })
        fetchPurchases()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setProcessing(false)
      setToggleDialog(null)
      setToggleReason('')
    }
  }

  const getContentTypeBadgeColor = (ct: string | null) => {
    switch (ct) {
      case 'mcq':
      case 'board-mcq':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'cq':
      case 'board-cq':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'lecture':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      case 'exam':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
      case 'suggestion':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
      case 'bundle':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      case 'package':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
      case 'mcq-exam-package':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bkash': return 'বিকাশ'
      case 'nagad': return 'নগদ'
      case 'rocket': return 'রকেট'
      default: return method
    }
  }

  if (loading && purchases.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" /> কন্টেন্ট ক্রয়
          </h1>
          <p className="text-muted-foreground text-sm mt-1">সকল কন্টেন্টের ক্রয়ের তথ্য পরিচালনা ও নিয়ন্ত্রণ করুন</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowTypeStats(!showTypeStats)}
        >
          <BarChart3 className="h-4 w-4" />
          {showTypeStats ? 'পরিসংখ্যান লুকান' : 'টাইপভিত্তিক পরিসংখ্যান'}
        </Button>
      </div>

      {/* Type Stats (collapsible) */}
      {showTypeStats && Object.keys(typeStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" /> কন্টেন্ট টাইপভিত্তিক ক্রয় পরিসংখ্যান
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(typeStats).sort((a, b) => b[1].total - a[1].total).map(([ct, s]) => (
                  <div
                    key={ct}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Badge className={getContentTypeBadgeColor(ct)}>
                      {contentTypeLabels[ct] || ct}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{s.total.toLocaleString('bn-BD')}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-emerald-600">সক্রিয়: {s.active.toLocaleString('bn-BD')}</span>
                        <span className="text-red-600">নিষ্ক্রিয়: {s.inactive.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট ক্রয়</p>
              <p className="text-xl font-bold">{stats.totalPurchases.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সক্রিয় ক্রয়</p>
              <p className="text-xl font-bold">{stats.activePurchases.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">নিষ্ক্রিয় ক্রয়</p>
              <p className="text-xl font-bold">{stats.inactivePurchases.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="নাম, ইমেইল বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={contentTypeFilter} onValueChange={(v) => { setContentTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="কন্টেন্ট টাইপ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব টাইপ</SelectItem>
                {Object.entries(contentTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="স্ট্যাটাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
                <SelectItem value="true">সক্রিয়</SelectItem>
                <SelectItem value="false">নিষ্ক্রিয়</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিক্ষার্থী</TableHead>
                  <TableHead>কন্টেন্ট</TableHead>
                  <TableHead className="hidden md:table-cell">টাইপ</TableHead>
                  <TableHead className="hidden sm:table-cell">মূল্য</TableHead>
                  <TableHead className="hidden lg:table-cell">পদ্ধতি</TableHead>
                  <TableHead className="hidden sm:table-cell">ক্রয়ের তারিখ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="w-28">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{purchase.user?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{purchase.user?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium line-clamp-1 max-w-[200px]">
                        {purchase.contentTitle || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={getContentTypeBadgeColor(purchase.contentType)}>
                        {contentTypeLabels[purchase.contentType || ''] || purchase.contentType || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-medium">
                      ৳{purchase.amount}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {getMethodLabel(purchase.method)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {new Date(purchase.createdAt).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          purchase.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }
                      >
                        {purchase.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailPurchase(purchase)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${purchase.isActive ? 'text-destructive' : 'text-emerald-600'}`}
                          onClick={() => { setToggleDialog(purchase); setToggleReason('') }}
                        >
                          {purchase.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {purchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      কোনো ক্রয়ের তথ্য পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            মোট {total.toLocaleString('bn-BD')}টি ক্রয়
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailPurchase} onOpenChange={() => setDetailPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ক্রয়ের বিস্তারিত</DialogTitle>
            <DialogDescription>ক্রয়ের সম্পূর্ণ তথ্য দেখুন</DialogDescription>
          </DialogHeader>
          {detailPurchase && (
            <div className="space-y-4">
              {/* Student info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">শিক্ষার্থী</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">নাম:</div>
                  <div className="font-medium">{detailPurchase.user?.name || 'N/A'}</div>
                  <div className="text-muted-foreground">ইমেইল:</div>
                  <div className="font-medium text-xs">{detailPurchase.user?.email || '-'}</div>
                  {detailPurchase.user?.phone && (
                    <>
                      <div className="text-muted-foreground">ফোন:</div>
                      <div className="font-medium text-xs">{detailPurchase.user.phone}</div>
                    </>
                  )}
                </div>
              </div>
              {/* Purchase info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ক্রয়ের তথ্য</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">কন্টেন্ট:</div>
                  <div className="font-medium line-clamp-2">{detailPurchase.contentTitle || '-'}</div>
                  <div className="text-muted-foreground">কন্টেন্ট টাইপ:</div>
                  <div>
                    <Badge className={getContentTypeBadgeColor(detailPurchase.contentType)}>
                      {contentTypeLabels[detailPurchase.contentType || ''] || detailPurchase.contentType || '-'}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">মূল্য:</div>
                  <div className="font-medium">৳{detailPurchase.amount}</div>
                  <div className="text-muted-foreground">পদ্ধতি:</div>
                  <div className="font-medium">{getMethodLabel(detailPurchase.method)}</div>
                  <div className="text-muted-foreground">ক্রয়ের তারিখ:</div>
                  <div className="font-medium">{new Date(detailPurchase.createdAt).toLocaleDateString('bn-BD')}</div>
                  <div className="text-muted-foreground">ট্রানজেকশন ID:</div>
                  <div className="font-mono text-xs">{detailPurchase.transactionId || '-'}</div>
                  {detailPurchase.classLevel && (
                    <>
                      <div className="text-muted-foreground">ক্লাস:</div>
                      <div className="font-medium">{detailPurchase.classLevel}</div>
                    </>
                  )}
                  <div className="text-muted-foreground">স্ট্যাটাস:</div>
                  <div>
                    <Badge
                      className={
                        detailPurchase.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }
                    >
                      {detailPurchase.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailPurchase(null)}>বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Dialog */}
      <Dialog open={!!toggleDialog} onOpenChange={() => { setToggleDialog(null); setToggleReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {toggleDialog?.isActive ? (
                <><ShieldOff className="size-5 text-destructive" /> ক্রয় নিষ্ক্রিয় করুন</>
              ) : (
                <><ShieldCheck className="size-5 text-emerald-600" /> ক্রয় সক্রিয় করুন</>
              )}
            </DialogTitle>
            <DialogDescription>
              {toggleDialog?.isActive ? (
                <>{toggleDialog?.user?.name} এর &quot;{toggleDialog?.contentTitle}&quot; কন্টেন্টের অ্যাক্সেস নিষ্ক্রিয় করতে চান?</>
              ) : (
                <>{toggleDialog?.user?.name} এর &quot;{toggleDialog?.contentTitle}&quot; কন্টেন্টের অ্যাক্সেস পুনরায় সক্রিয় করতে চান?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">শিক্ষার্থী:</div>
                <div className="font-medium">{toggleDialog?.user?.name}</div>
                <div className="text-muted-foreground">কন্টেন্ট:</div>
                <div className="font-medium line-clamp-1">{toggleDialog?.contentTitle}</div>
                <div className="text-muted-foreground">কন্টেন্ট টাইপ:</div>
                <div>
                  <Badge className={getContentTypeBadgeColor(toggleDialog?.contentType ?? null)}>
                    {contentTypeLabels[toggleDialog?.contentType || ''] || toggleDialog?.contentType}
                  </Badge>
                </div>
                <div className="text-muted-foreground">মূল্য:</div>
                <div className="font-medium">৳{toggleDialog?.amount}</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                কারণ <span className="text-muted-foreground">(ঐচ্ছিক)</span>
              </label>
              <Textarea
                placeholder={toggleDialog?.isActive ? 'নিষ্ক্রিয় করার কারণ লিখুন...' : 'সক্রিয় করার কারণ লিখুন...'}
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setToggleDialog(null); setToggleReason('') }}>বাতিল</Button>
            <Button
              variant={toggleDialog?.isActive ? 'destructive' : 'default'}
              className={`gap-2 ${!toggleDialog?.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={handleToggleActive}
              disabled={processing}
            >
              {toggleDialog?.isActive ? (
                <><XCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'নিষ্ক্রিয় করুন'}</>
              ) : (
                <><CheckCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'সক্রিয় করুন'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
