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

interface PurchaseRecord {
  id: string
  userId: string
  packageId: string
  paymentId: string | null
  purchasedAt: string
  isActive: boolean
  user: { id: string; name: string; email: string }
  package: { id: string; title: string; price: number; isPremium: boolean }
}

interface PackageOption {
  id: string
  title: string
}

export default function AdminMCQExamPurchasesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [packageFilter, setPackageFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [stats, setStats] = useState({ totalPurchases: 0, activePurchases: 0, inactivePurchases: 0 })
  const [detailPurchase, setDetailPurchase] = useState<PurchaseRecord | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState<PurchaseRecord | null>(null)
  const [processing, setProcessing] = useState(false)
  const [packages, setPackages] = useState<PackageOption[]>([])
  const limit = 20

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mcq-exam-packages?limit=200')
      if (res.ok) {
        const json = await res.json()
        setPackages((Array.isArray(json.data?.packages) ? json.data.packages : []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })))
      }
    } catch { /* */ }
  }, [])

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (packageFilter !== 'all') params.set('packageId', packageFilter)
      if (activeFilter !== 'all') params.set('isActive', activeFilter)
      if (userSearch) params.set('userId', userSearch)

      const res = await fetch(`/api/admin/mcq-exam-purchases?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPurchases(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
        setStats(json.stats || { totalPurchases: 0, activePurchases: 0, inactivePurchases: 0 })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'ক্রয়ের তথ্য লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, packageFilter, activeFilter, userSearch, toast])

  useEffect(() => { fetchPackages() }, [fetchPackages])
  useEffect(() => { fetchPurchases() }, [fetchPurchases])

  const totalPages = Math.ceil(total / limit)

  const handleToggleActive = async (purchase: PurchaseRecord) => {
    setProcessing(true)
    try {
      if (purchase.isActive) {
        // Deactivate
        const res = await fetch(`/api/admin/mcq-exam-purchases?id=${purchase.id}`, { method: 'DELETE' })
        if (res.ok) {
          toast({ title: 'ক্রয় নিষ্ক্রিয় করা হয়েছে', description: `${purchase.user?.name} এর ক্রয় নিষ্ক্রিয় করা হয়েছে` })
          fetchPurchases()
        } else {
          const json = await res.json()
          toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
        }
      }
      // Note: reactivation not supported via DELETE, would need a PUT endpoint
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally {
      setProcessing(false)
      setDeactivateDialog(null)
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-emerald-600" /> MCQ এক্সাম প্যাকেজ ক্রয়
        </h1>
        <p className="text-muted-foreground text-sm mt-1">MCQ এক্সাম প্যাকেজ ক্রয়ের তথ্য পরিচালনা করুন</p>
      </div>

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
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{purchase.package?.title || 'N/A'}</p>
                        {purchase.package?.isPremium && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 mt-0.5">প্রিমিয়াম</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {new Date(purchase.purchasedAt).toLocaleDateString('bn-BD')}
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
                        {purchase.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeactivateDialog(purchase)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {purchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
          </DialogHeader>
          {detailPurchase && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">শিক্ষার্থী:</div>
                  <div className="font-medium">{detailPurchase.user?.name || 'N/A'}</div>
                  <div className="text-muted-foreground">ইমেইল:</div>
                  <div className="font-medium text-xs">{detailPurchase.user?.email || '-'}</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">প্যাকেজ:</div>
                  <div className="font-medium">{detailPurchase.package?.title || '-'}</div>
                  <div className="text-muted-foreground">মূল্য:</div>
                  <div className="font-medium">৳{detailPurchase.package?.price || 0}</div>
                  <div className="text-muted-foreground">ক্রয়ের তারিখ:</div>
                  <div className="font-medium">{new Date(detailPurchase.purchasedAt).toLocaleDateString('bn-BD')}</div>
                  <div className="text-muted-foreground">পেমেন্ট ID:</div>
                  <div className="font-mono text-xs">{detailPurchase.paymentId || '-'}</div>
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

      {/* Deactivate Dialog */}
      <Dialog open={!!deactivateDialog} onOpenChange={() => setDeactivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" /> ক্রয় নিষ্ক্রিয় করুন
            </DialogTitle>
            <DialogDescription>
              {deactivateDialog?.user?.name} এর &quot;{deactivateDialog?.package?.title}&quot; প্যাকেজ ক্রয় নিষ্ক্রিয় করতে চান?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialog(null)}>বাতিল</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deactivateDialog && handleToggleActive(deactivateDialog)}
              disabled={processing}
            >
              <XCircle className="size-4" /> {processing ? 'প্রক্রিয়াধীন...' : 'নিষ্ক্রিয় করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
