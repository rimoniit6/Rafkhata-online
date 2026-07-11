'use client'

import React, { useState } from 'react'
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
  Trash2,
  Power,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { QueryError } from '@/components/admin/QueryError'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'

import { useSubscriptions } from '@/hooks/admin/use-subscriptions'
import { usePackages } from '@/hooks/admin/use-packages'
import { subscriptionService } from '@/services/api/subscription.service'

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

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [detailSub, setDetailSub] = useState<SubscriptionRecord | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState<SubscriptionRecord | null>(null)
  const [extendDialog, setExtendDialog] = useState<SubscriptionRecord | null>(null)
  const [extendDays, setExtendDays] = useState(30)
  const [processing, setProcessing] = useState(false)
  const limit = 20

  const { subscriptions, pagination, stats, isLoading, isError, error, refetch, invalidate } = useSubscriptions({
    page,
    limit,
    isActive: activeFilter !== 'all' ? activeFilter : undefined,
    packageId: packageFilter !== 'all' ? packageFilter : undefined,
    userId: userSearch || undefined,
  })

  const total = pagination?.total ?? 0

  const { packages } = usePackages({ limit: 200 })

  const selection = useTableSelection(subscriptions)

  const handleToggleActive = async (sub: SubscriptionRecord) => {
    setProcessing(true)
    try {
      await subscriptionService.update({ id: sub.id, isActive: !sub.isActive })
      toast({
        title: sub.isActive ? 'সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে' : 'সাবস্ক্রিপশন সক্রিয় করা হয়েছে',
        description: `${sub.user?.name} এর সাবস্ক্রিপশন আপডেট হয়েছে`,
      })
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    } finally {
      setProcessing(false)
      setDeactivateDialog(null)
    }
  }

  const handleDeactivate = async (sub: SubscriptionRecord) => {
    setProcessing(true)
    try {
      await subscriptionService.remove(sub.id)
      toast({ title: 'সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে', description: `${sub.user?.name} এর সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে` })
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    } finally {
      setProcessing(false)
      setDeactivateDialog(null)
    }
  }

  const handleExtend = async () => {
    if (!extendDialog || extendDays <= 0) return
    setProcessing(true)
    try {
      await subscriptionService.update({ id: extendDialog.id, extendDays })
      toast({
        title: 'সাবস্ক্রিপশন বাড়ানো হয়েছে',
        description: `${extendDialog.user?.name} এর সাবস্ক্রিপশন ${extendDays} দিন বাড়ানো হয়েছে`,
      })
      invalidate()
    } catch {
      // Errors are surfaced globally by ApiErrorHandler
    } finally {
      setProcessing(false)
      setExtendDialog(null)
      setExtendDays(30)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (processing) return
    setProcessing(true)
    try {
      await subscriptionService.bulkDelete(ids)
      toast({ title: 'মুছে ফেলা হয়েছে' })
      selection.clearSelection()
      invalidate()
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkToggle = async (ids: string[], isActive: boolean) => {
    if (processing) return
    setProcessing(true)
    try {
      await subscriptionService.bulkToggle({ ids, isActive })
      toast({ title: 'আপডেট হয়েছে' })
      selection.clearSelection()
      invalidate()
    } finally {
      setProcessing(false)
    }
  }

  const columns: ColumnDef<SubscriptionRecord>[] = [
    {
      key: 'user',
      header: 'শিক্ষার্থী',
      render: (sub) => (
        <div>
          <p className="font-medium text-sm">{sub.user?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{sub.user?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'package',
      header: 'প্যাকেজ',
      render: (sub) => <p className="text-sm font-medium line-clamp-1">{sub.package?.title || 'N/A'}</p>,
    },
    {
      key: 'classLevel',
      header: 'শ্রেণি',
      headerClass: 'hidden md:table-cell',
      cellClass: 'hidden md:table-cell',
      render: (sub) => <Badge variant="outline" className="text-[9px] h-4 px-1">{sub.classLevel || '-'}</Badge>,
    },
    {
      key: 'startDate',
      header: 'শুরু',
      headerClass: 'hidden sm:table-cell',
      cellClass: 'hidden sm:table-cell text-sm',
      render: (sub) => new Date(sub.startDate).toLocaleDateString('bn-BD'),
    },
    {
      key: 'endDate',
      header: 'মেয়াদ',
      headerClass: 'hidden sm:table-cell',
      cellClass: 'hidden sm:table-cell text-sm',
      render: (sub) => new Date(sub.endDate).toLocaleDateString('bn-BD'),
    },
    {
      key: 'daysLeft',
      header: 'দিন বাকি',
      render: (sub) => {
        const daysLeft = getDaysLeft(sub.endDate)
        const isExpired = daysLeft <= 0
        return (
          <Badge className={
            isExpired
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : daysLeft <= 7
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
          }>
            {isExpired ? 'মেয়াদোত্তীর্ণ' : `${daysLeft} দিন`}
          </Badge>
        )
      },
    },
    {
      key: 'isActive',
      header: 'স্ট্যাটাস',
      render: (sub) => (
        <Badge className={
          sub.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }>
          {sub.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cellClass: 'w-32',
      render: (sub) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailSub(sub)} aria-label="বিস্তারিত">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => { setExtendDialog(sub); setExtendDays(30) }} title="মেয়াদ বাড়ান">
            <CalendarPlus className="h-4 w-4" />
          </Button>
          {sub.isActive ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeactivateDialog(sub)} aria-label="নিষ্ক্রিয় করুন">
              <XCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleToggleActive(sub)} title="সক্রিয় করুন">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
      disabled: processing,
    },
    {
      label: 'সক্রিয় করুন',
      icon: <Power className="size-4" />,
      handler: (ids) => handleBulkToggle(ids, true),
      disabled: processing,
    },
    {
      label: 'নিষ্ক্রিয় করুন',
      icon: <XCircle className="size-4" />,
      handler: (ids) => handleBulkToggle(ids, false),
      disabled: processing,
    },
  ]

  const filters = (
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
  )

  if (isLoading && subscriptions.length === 0) {
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

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
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
              <p className="text-xl font-bold">{(stats?.totalSubscriptions ?? 0).toLocaleString('bn-BD')}</p>
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
              <p className="text-xl font-bold">{(stats?.activeSubscriptions ?? 0).toLocaleString('bn-BD')}</p>
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
              <p className="text-xl font-bold">{(stats?.expiredButActive ?? 0).toLocaleString('bn-BD')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={subscriptions}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        loading={isLoading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো সাবস্ক্রিপশন পাওয়া যায়নি"
        filters={filters}
      />

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
    </div>
  )
}
