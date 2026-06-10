'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  CalendarPlus,
  Users,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

interface SubscriptionRecord {
  id: string
  userId: string
  packageId: string
  classLevel: string
  startDate: string
  endDate: string
  isActive: boolean
  paymentId: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
  package: { id: string; title: string; duration: number; durationLabel: string; price: number }
}

interface PackageOption {
  id: string
  title: string
}

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [stats, setStats] = useState({ totalSubscriptions: 0, activeSubscriptions: 0, expiredButActive: 0 })
  const [detailSub, setDetailSub] = useState<SubscriptionRecord | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState<SubscriptionRecord | null>(null)
  const [extendDialog, setExtendDialog] = useState<SubscriptionRecord | null>(null)
  const [extendDays, setExtendDays] = useState(30)
  const [processing, setProcessing] = useState(false)
  const [packages, setPackages] = useState<PackageOption[]>([])
  const limit = 20

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/packages?limit=200')
      if (res.ok) {
        const json = await res.json()
        setPackages((json.data?.packages || []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })))
      }
    } catch { /* */ }
  }, [])

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (activeFilter !== 'all') params.set('isActive', activeFilter)
      if (packageFilter !== 'all') params.set('packageId', packageFilter)
      if (userSearch) params.set('userId', userSearch)

      const res = await fetch(`/api/admin/subscriptions?${params}`)
      if (res.ok) {
        const json = await res.json()
        setSubscriptions(Array.isArray(json.data?.data) ? json.data.data : [])
        setTotal(json.data?.pagination?.total || 0)
        setStats(json.data?.stats || { totalSubscriptions: 0, activeSubscriptions: 0, expiredButActive: 0 })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সাবস্ক্রিপশনের তথ্য লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, activeFilter, packageFilter, userSearch, toast])

  useEffect(() => { fetchPackages() }, [fetchPackages])
  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  const totalPages = Math.ceil(total / limit)

  const handleToggleActive = async (sub: SubscriptionRecord) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, isActive: !sub.isActive }),
      })
      if (res.ok) {
        toast({
          title: sub.isActive ? 'সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে' : 'সাবস্ক্রিপশন সক্রিয় করা হয়েছে',
          description: `${sub.user?.name} এর সাবস্ক্রিপশন আপডেট হয়েছে`,
        })
        fetchSubscriptions()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setProcessing(false)
      setDeactivateDialog(null)
    }
  }

  const handleDeactivate = async (sub: SubscriptionRecord) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?id=${sub.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে', description: `${sub.user?.name} এর সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে` })
        fetchSubscriptions()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setProcessing(false)
      setDeactivateDialog(null)
    }
  }

  const handleExtend = async () => {
    if (!extendDialog || extendDays <= 0) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: extendDialog.id, extendDays }),
      })
      if (res.ok) {
        toast({
          title: 'সাবস্ক্রিপশন বাড়ানো হয়েছে',
          description: `${extendDialog.user?.name} এর সাবস্ক্রিপশন ${extendDays} দিন বাড়ানো হয়েছে`,
        })
        fetchSubscriptions()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setProcessing(false)
      setExtendDialog(null)
      setExtendDays(30)
    }
  }

  if (loading && subscriptions.length === 0) {
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-600" /> সাবস্ক্রিপশন ব্যবস্থাপনা
        </h1>
        <p className="text-muted-foreground text-sm mt-1">ব্যবহারকারীদের সাবস্ক্রিপশন পরিচালনা করুন</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট সাবস্ক্রিপশন</p>
              <p className="text-xl font-bold">{stats.totalSubscriptions.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30">
              <UserCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সক্রিয় সাবস্ক্রিপশন</p>
              <p className="text-xl font-bold">{stats.activeSubscriptions.toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মেয়াদোত্তীর্ণ (সক্রিয়)</p>
              <p className="text-xl font-bold">{stats.expiredButActive.toLocaleString('bn-BD')}</p>
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
                placeholder="ব্যবহারকারী ID দিয়ে খুঁজুন..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={packageFilter} onValueChange={(v) => { setPackageFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="প্যাকেজ নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব প্যাকেজ</SelectItem>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>{pkg.title}</SelectItem>
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
                  <TableHead>প্যাকেজ</TableHead>
                  <TableHead className="hidden md:table-cell">শ্রেণি</TableHead>
                  <TableHead className="hidden sm:table-cell">শুরু</TableHead>
                  <TableHead className="hidden sm:table-cell">মেয়াদ</TableHead>
                  <TableHead>দিন বাকি</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="w-32">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const daysLeft = getDaysLeft(sub.endDate)
                  const isExpired = daysLeft <= 0
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sub.user?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{sub.user?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium line-clamp-1">{sub.package?.title || 'N/A'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {sub.classLevel || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(sub.startDate).toLocaleDateString('bn-BD')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(sub.endDate).toLocaleDateString('bn-BD')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isExpired
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : daysLeft <= 7
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          }
                        >
                          {isExpired ? 'মেয়াদোত্তীর্ণ' : `${daysLeft} দিন`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sub.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }
                        >
                          {sub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailSub(sub)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => { setExtendDialog(sub); setExtendDays(30) }}
                            title="মেয়াদ বাড়ান"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          {sub.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeactivateDialog(sub)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!sub.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600"
                              onClick={() => handleToggleActive(sub)}
                              title="সক্রিয় করুন"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      কোনো সাবস্ক্রিপশন পাওয়া যায়নি
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
            মোট {total.toLocaleString('bn-BD')}টি সাবস্ক্রিপশন
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
      <Dialog open={!!detailSub} onOpenChange={() => setDetailSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>সাবস্ক্রিপশনের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {detailSub && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">শিক্ষার্থী:</div>
                  <div className="font-medium">{detailSub.user?.name || 'N/A'}</div>
                  <div className="text-muted-foreground">ইমেইল:</div>
                  <div className="font-medium text-xs">{detailSub.user?.email || '-'}</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">প্যাকেজ:</div>
                  <div className="font-medium">{detailSub.package?.title || '-'}</div>
                  <div className="text-muted-foreground">মূল্য:</div>
                  <div className="font-medium">৳{detailSub.package?.price || 0}</div>
                  <div className="text-muted-foreground">শ্রেণি:</div>
                  <div className="font-medium">{detailSub.classLevel || '-'}</div>
                  <div className="text-muted-foreground">স্থায়িত্ব:</div>
                  <div className="font-medium">{detailSub.package?.durationLabel || `${detailSub.package?.duration} দিন`}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">শুরু:</span>
                  <p className="font-medium">{new Date(detailSub.startDate).toLocaleDateString('bn-BD')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">মেয়াদ:</span>
                  <p className="font-medium">{new Date(detailSub.endDate).toLocaleDateString('bn-BD')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">দিন বাকি:</span>
                  <p className="font-medium">{getDaysLeft(detailSub.endDate)} দিন</p>
                </div>
                <div>
                  <span className="text-muted-foreground">স্ট্যাটাস:</span>
                  <Badge
                    className={
                      detailSub.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }
                  >
                    {detailSub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                </div>
                {detailSub.paymentId && (
                  <>
                    <div>
                      <span className="text-muted-foreground">পেমেন্ট ID:</span>
                      <p className="font-mono text-xs">{detailSub.paymentId}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailSub(null)}>বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={!!deactivateDialog} onOpenChange={() => setDeactivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" /> সাবস্ক্রিপশন নিষ্ক্রিয় করুন
            </DialogTitle>
            <DialogDescription>
              {deactivateDialog?.user?.name} এর &quot;{deactivateDialog?.package?.title}&quot; সাবস্ক্রিপশন নিষ্ক্রিয় করতে চান?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialog(null)}>বাতিল</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deactivateDialog && handleDeactivate(deactivateDialog)}
              disabled={processing}
            >
              <XCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'নিষ্ক্রিয় করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={!!extendDialog} onOpenChange={() => { setExtendDialog(null); setExtendDays(30) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="size-5 text-emerald-600" /> মেয়াদ বাড়ান
            </DialogTitle>
            <DialogDescription>
              {extendDialog?.user?.name} এর &quot;{extendDialog?.package?.title}&quot; সাবস্ক্রিপশনের মেয়াদ বাড়াতে চান?
            </DialogDescription>
          </DialogHeader>
          {extendDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">বর্তমান মেয়াদ:</div>
                  <div className="font-medium">{new Date(extendDialog.endDate).toLocaleDateString('bn-BD')}</div>
                  <div className="text-muted-foreground">দিন বাকি:</div>
                  <div className="font-medium">{getDaysLeft(extendDialog.endDate)} দিন</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extendDays">বাড়ানোর দিন সংখ্যা</Label>
                <Input
                  id="extendDays"
                  type="number"
                  min={1}
                  max={3650}
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  নতুন মেয়াদ: {(() => {
                    const currentEnd = new Date(extendDialog.endDate)
                    const now = new Date()
                    const base = currentEnd > now ? currentEnd : now
                    const newEnd = new Date(base)
                    newEnd.setDate(newEnd.getDate() + extendDays)
                    return newEnd.toLocaleDateString('bn-BD')
                  })()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExtendDialog(null); setExtendDays(30) }}>বাতিল</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={handleExtend}
              disabled={processing || extendDays <= 0}
            >
              <CalendarPlus className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'মেয়াদ বাড়ান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
